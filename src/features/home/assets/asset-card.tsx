'use client';

import { useAlgoClientConfig } from '@/hooks/use-algo-client-config';
import { IAccountAssetInformation, IAsset } from '@/interface/asset.interface';
import { FiCheckCircle } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { usePeraWallet } from '@/hooks/use-pera-wallet';
import { Spinner } from '@/components/spinner';
import toast from 'react-hot-toast';
import { makeAssetTransferTxnWithSuggestedParamsFromObject, waitForConfirmation } from 'algosdk';
import { peraWallet } from '@/config/pera';
import { beautifyError } from '@/utils/beautify-error';
import { useSetRecoilState } from 'recoil';
import { RefreshWalletAtom } from '@/state';

interface Props {
  data: IAsset;
}

export const AssetCard = ({ data }: Props) => {
  const { algod } = useAlgoClientConfig();
  const { activeAddress } = usePeraWallet();
  const setRefreshWallet = useSetRecoilState(RefreshWalletAtom);
  const [assetInformation, setAssetInformation] = useState<IAccountAssetInformation>();
  const [loading, setLoading] = useState(false);

  const balance = (assetInformation?.amount || 0) * Math.pow(10, -1 * data.fraction_decimals);

  const getAssetInformation = async () => {
    if (!activeAddress || !algod || !!assetInformation) {
      return;
    }

    setLoading(true);

    try {
      const assetInfo = await algod.accountAssetInformation(activeAddress, data.asset_id).do();
      setAssetInformation(assetInfo['asset-holding']);
    } catch (error) {
      console.error(`No asset info found for ${data.asset_id}: ${error}`);
    }

    setLoading(false);
  };

  const optIntoAsset = async () => {
    if (loading || !activeAddress || !algod) {
      return;
    }

    setLoading(true);

    toast.loading(`Opting into ${data.name}...`, { id: 'loader' });

    const suggestedParams = await algod.getTransactionParams().do();
    const txn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: activeAddress,
      assetIndex: data.asset_id,
      amount: 0,
      suggestedParams,
    });

    const txnGroup = [{ txn, signers: [activeAddress] }];

    try {
      const signedTxn = await peraWallet.signTransaction([txnGroup]);
      const txId = await algod.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(algod, txId.txId, 4);
      toast.dismiss('loader');
      toast.success(`You have successfully opted into ${data.name}`);
      setLoading(false);
      getAssetInformation();
      setRefreshWallet((old) => old + 1);
    } catch (error) {
      toast.dismiss('loader');
      toast.error(beautifyError(`${error}`));
      setLoading(false);
    }
  };

  useEffect(() => {
    getAssetInformation();
  }, [activeAddress, algod]);

  return (
    <div className="flex flex-col px-3 py-3 gap-4 border-[1px] border-[#e8f3f1] rounded-md shadow-lg">
      <div className="flex flex-row items-center justify-between">
        <div className="text-sm text-[#464545] font-[600]">#{data.asset_id}</div>
        {assetInformation ? (
          <div className="text-xs font-[600] text-[#33d5ba] rounded-md px-2 py-1">Opted in</div>
        ) : (
          <button
            disabled={loading}
            className="text-xs min-w-[70px] font-[600] bg-[#33d5ba] text-white rounded-md px-2 py-1 flex justify-center items-center"
            onClick={optIntoAsset}
          >
            {loading ? <Spinner size={12} color="#fff" /> : 'Opt-in +'}
          </button>
        )}
      </div>

      <div className="flex flex-row items-center gap-4">
        <img
          src={
            data.logo ||
            `https://ui-avatars.com/api/?name=${data.name}&background=random&font-size=0.35&color=fff&rounded=true ⁠`
          }
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <div className="flex flex-row justify-between items-center flex-1">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center text-sm text-[#4e4e4e] font-[600] gap-2">
              {data.name}
              <FiCheckCircle color="#33d5ba" />
            </div>
            <div className="flex flex-row items-center text-base text-[#171717] font-[600]">
              {data.unit_name}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center gap-1 justify-between">
        <div className="flex flex-row items-center text-sm text-[#171717] font-[400] gap-2">
          Balance: {balance.toLocaleString()}
        </div>
        <div className="flex flex-row items-center text-sm text-[#171717] font-[400]">
          ${Number(data.usd_value || 0)}
        </div>
      </div>
    </div>
  );
};
