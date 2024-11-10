'use client';

import { Button } from '@/components/buttons';
import { Input } from '@/components/input';
import { PushDropdown } from '@/components/push-dropdown';
import { useAlgoClientConfig } from '@/hooks/use-algo-client-config';
import { usePeraWallet } from '@/hooks/use-pera-wallet';
import { SignerTransaction } from '@perawallet/connect/dist/util/model/peraWalletModels';
import {
  IAccountAssetInformation,
  IAccountAssetInformationExtended,
} from '@/interface/asset.interface';
import { useEffect, useState } from 'react';
import { peraWallet } from '@/config/pera';
import { beautifyError } from '@/utils/beautify-error';
import {
  generateAssetTransferTxn,
  generateOptIntoAssetTxn,
  generatePaymentTxn,
} from '@/utils/transaction-generator';
import { useSetRecoilState } from 'recoil';
import { RefreshWalletAtom } from '@/state';
import { waitForConfirmation } from 'algosdk';
import toast from 'react-hot-toast';

export const AtomicSwap = () => {
  const { accounts, activeAddress } = usePeraWallet();
  const { algod } = useAlgoClientConfig();

  /** The assets of the person initiating the swap */
  const [senderAssets, setSenderAssets] = useState<IAccountAssetInformationExtended[]>([]);

  /** The assets of the person receiving the swap */
  const [receiverAssets, setReceiverAssets] = useState<IAccountAssetInformationExtended[]>([]);

  /** Algo balance of the person receiving the swap */
  const [receiverAlgoBalance, setReceiverAlgoBalance] = useState(0);

  /** Loading state */
  const [gettingSenderAssets, setGettingSenderAssets] = useState(false);
  const [gettingReceiverAssets, setGettingReceiverAssets] = useState(false);
  const [swapping, setSwapping] = useState(false);

  /** Global state setter for triggering a wallet balance refresh of the connected address */
  const setRefreshWallet = useSetRecoilState(RefreshWalletAtom);

  /** Address of the receiver */
  const [receiverAddress, setReceiverAddress] = useState<string | null>(null);

  /** Type of asset to be swapped to. Can either be Algo or other ASA types */
  const [receiverAssetType, setReceiverAssetType] = useState<'Algo' | 'Other ASA'>();

  /** Information of assets to be swapped */
  const [from, setFrom] = useState<{
    numberOfUnits: number;
    asset: IAccountAssetInformationExtended | null;
  }>({
    asset: null,
    numberOfUnits: 0,
  });
  const [to, setTo] = useState<{
    numberOfUnits: number;
    asset: IAccountAssetInformationExtended | null;
  }>({
    asset: null,
    numberOfUnits: 0,
  });

  /** Gets all assets opted into by the provided address */
  const getAccountAssets = async (address: string): Promise<IAccountAssetInformationExtended[]> => {
    const assets: IAccountAssetInformationExtended[] = [];

    try {
      const response = await algod?.accountInformation(address).do();
      const assetsRaw: IAccountAssetInformation[] = response?.assets?.filter(
        (asset: any) => !asset['is-frozen'],
      );

      for (const asset of assetsRaw) {
        const assetInfo = await algod?.getAssetByID(asset['asset-id']).do();
        const assetInfoFinal: IAccountAssetInformationExtended = {
          ...asset,
          name: assetInfo?.params?.name,
          'unit-name': assetInfo?.params?.['unit-name'],
          creator: assetInfo?.params?.creator,
          decimals: assetInfo?.params?.decimals,
        };
        assets.push(assetInfoFinal);
      }
    } catch (error) {
      console.error(error);
    }

    return assets;
  };

  /** Retrieves all assets of the person initiating the swap */
  const getAssetsOfSender = async () => {
    setGettingSenderAssets(true);

    if (activeAddress && !!algod) {
      const assets = await getAccountAssets(activeAddress!);
      setSenderAssets(assets);
    } else {
      setSenderAssets([]);
    }

    setGettingSenderAssets(false);
    setFrom({
      numberOfUnits: 0,
      asset: null,
    });
  };

  /** Retrieves all assets of the recipient of the swap */
  const getAssetsOfReceiver = async () => {
    setTo({
      numberOfUnits: 0,
      asset: null,
    });
    setGettingReceiverAssets(true);

    if (receiverAddress && !!algod) {
      const assets = await getAccountAssets(receiverAddress);
      setReceiverAssets(assets);
    } else {
      setReceiverAssets([]);
    }

    setGettingReceiverAssets(false);
  };

  /** Gets algo balance of the receiver */
  const getAlgoBalanceOfReceiver = async () => {
    if (!receiverAddress || !algod) {
      setReceiverAlgoBalance(0);
      return;
    }

    try {
      const accountInfo = await algod.accountInformation(receiverAddress).do();
      const balance = accountInfo.amount.toString();
      setReceiverAlgoBalance(Number(balance) / 1_000_000);
    } catch (error) {
      console.error(error);
      setReceiverAlgoBalance(0);
    }
  };

  /** Check if the provided address is already opted into the asset with provided assetId */
  const checkAssetOptinStatus = async (address: string, assetId: number): Promise<boolean> => {
    try {
      const res = await algod!.accountAssetInformation(address, assetId).do();
      return !!res;
    } catch (error) {
      return false;
    }
  };

  /** Creates and submits swap transactions */
  const submitSwap = async () => {
    if (swapping) return;

    setSwapping(true);
    toast.loading('Initiating swap...', { id: 'loader' });
    const txnGroup: SignerTransaction[][] = [];

    const receiverIsOptedIn = await checkAssetOptinStatus(
      receiverAddress!,
      from.asset!['asset-id'],
    );

    if (!receiverIsOptedIn) {
      const receiverOptinTxn = await generateOptIntoAssetTxn({
        algod: algod!,
        initiatorAddr: receiverAddress!,
        assetID: from.asset!['asset-id'],
      });

      txnGroup.push(receiverOptinTxn);
    }

    if (receiverAssetType === 'Other ASA') {
      const senderIsOptedIn = await checkAssetOptinStatus(activeAddress!, to.asset!['asset-id']!);

      if (!senderIsOptedIn) {
        const senderOptinTxn = await generateOptIntoAssetTxn({
          algod: algod!,
          initiatorAddr: activeAddress!,
          assetID: to.asset!['asset-id'],
        });

        txnGroup.push(senderOptinTxn);
      }

      const assetTransferFromReceiverToSenderTxn = await generateAssetTransferTxn({
        algod: algod!,
        initiatorAddr: receiverAddress!,
        to: activeAddress!,
        amount: to.numberOfUnits * Math.pow(10, to.asset!.decimals),
        assetID: to.asset!['asset-id'],
      });

      txnGroup.push(assetTransferFromReceiverToSenderTxn);
    } else {
      const algoTransferFromReceiverToSenderTxn = await generatePaymentTxn({
        algod: algod!,
        initiatorAddr: receiverAddress!,
        to: activeAddress!,
        amount: to.numberOfUnits * 1_000_000,
      });
      txnGroup.push(algoTransferFromReceiverToSenderTxn);
    }

    const assetTransferTxnFromSenderToReceiver = await generateAssetTransferTxn({
      algod: algod!,
      initiatorAddr: activeAddress!,
      to: receiverAddress!,
      amount: from.numberOfUnits * Math.pow(10, from.asset!.decimals),
      assetID: from.asset!['asset-id'],
    });

    txnGroup.push(assetTransferTxnFromSenderToReceiver);

    try {
      const signedTxnGroup = await peraWallet.signTransaction(txnGroup);

      for (const signedTxn of signedTxnGroup) {
        const txn = await algod!.sendRawTransaction(signedTxn).do();
        await waitForConfirmation(algod!, txn.txId, 8);
      }

      toast.dismiss('loader');
      toast.success(
        `You have successfully swapped ${from.numberOfUnits.toLocaleString()} ${
          from.asset!['unit-name']
        } for ${to.numberOfUnits.toLocaleString()} ${
          receiverAssetType === 'Algo' ? 'algo' : to.asset!['unit-name']
        }`,
      );

      setRefreshWallet((old) => old + 1);
      getAlgoBalanceOfReceiver();
      getAssetsOfReceiver();
      getAssetsOfSender();
    } catch (error) {
      toast.dismiss('loader');
      toast.error(beautifyError(`${error}`));
    }

    setSwapping(false);
  };

  const formatAmount = (amount: number, decimals = 0) => {
    return amount * Math.pow(10, -1 * decimals);
  };

  const fromAmountError =
    (!!from.asset && formatAmount(from.asset.amount, from.asset.decimals) < from.numberOfUnits) ||
    (!!from.asset && from.numberOfUnits === 0)
      ? `Please enter an amount less than or equal to your balance of ${formatAmount(
          from.asset.amount,
          from.asset.decimals,
        ).toLocaleString()} ${from.asset['unit-name']} and greater than 0`
      : '';

  const toAmountError =
    receiverAssetType === 'Algo' &&
    (to.numberOfUnits === 0 || to.numberOfUnits > receiverAlgoBalance)
      ? `Please enter an amount less than or equal to the receiver's balance of ${receiverAlgoBalance} algos and greater than 0`
      : (!!to.asset && formatAmount(to.asset.amount, to.asset.decimals) < to.numberOfUnits) ||
        (!!to.asset && to.numberOfUnits === 0)
      ? `Please enter an amount less than or equal to the receiver's balance of ${formatAmount(
          to.asset.amount,
          to.asset.decimals,
        ).toLocaleString()} ${to.asset['unit-name']} and greater than 0`
      : '';

  const canSubmit =
    !toAmountError &&
    !fromAmountError &&
    !!receiverAddress &&
    !!from.asset &&
    !!from.numberOfUnits &&
    !!to.numberOfUnits &&
    !!receiverAssetType &&
    !!algod &&
    !!activeAddress;

  useEffect(() => {
    getAssetsOfReceiver();
    getAlgoBalanceOfReceiver();
  }, [algod, receiverAddress]);

  useEffect(() => {
    getAssetsOfSender();
  }, [activeAddress, algod]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 w-[600px]">
        <hr />
        <PushDropdown
          value={
            from.asset
              ? `${from.asset.name} (${from.asset['unit-name']}) #${from.asset['asset-id']}`
              : ''
          }
          label="Asset to swap from"
          placeholder={
            !gettingSenderAssets && !senderAssets.length
              ? `Your account does not have any assets you can swap from`
              : 'Asset to swap from'
          }
          onChange={(value) => {
            const targetAssetName = value.split(' (')[0];
            const targetAsset = senderAssets.find((asset) => asset.name === targetAssetName);
            setFrom((old) => ({ ...old, asset: targetAsset || null }));
          }}
          data={senderAssets.map(
            (asset) => `${asset.name} (${asset['unit-name']}) #${asset['asset-id']}`,
          )}
          loading={gettingSenderAssets}
        />
        <Input
          value={String(from.numberOfUnits)}
          type="number"
          label="Number of units of asset to swap from"
          placeholder="No. of units"
          onChange={(value) => setFrom((old) => ({ ...old, numberOfUnits: Number(value) }))}
          error={fromAmountError}
        />
        <hr />
        <PushDropdown
          label="Receiver address (only connected accounts show here)"
          data={(accounts || []).filter((addr) => addr !== activeAddress)}
          placeholder="Select the receiver address"
          onChange={(value) => setReceiverAddress(value)}
          value={receiverAddress || undefined}
        />
        <hr />
        <PushDropdown
          value={receiverAssetType}
          label="Asset type to swap to"
          onChange={(value) => setReceiverAssetType(value as any)}
          data={['Algo', 'Other ASA']}
        />

        {receiverAssetType === 'Other ASA' && (
          <PushDropdown
            value={
              to.asset ? `${to.asset.name} (${to.asset['unit-name']}) #${to.asset['asset-id']}` : ''
            }
            label="Asset to swap to"
            placeholder={
              !gettingReceiverAssets && !receiverAssets.length
                ? `The receiver account does not have any assets you can swap to`
                : 'Asset to swap to'
            }
            onChange={(value) => {
              const targetAssetName = value.split(' (')[0];
              const targetAsset = receiverAssets.find((asset) => asset.name === targetAssetName);
              setTo((old) => ({ ...old, asset: targetAsset || null }));
            }}
            data={receiverAssets.map(
              (asset) => `${asset.name} (${asset['unit-name']}) #${asset['asset-id']}`,
            )}
            loading={gettingReceiverAssets}
          />
        )}

        <Input
          value={String(to.numberOfUnits)}
          type="number"
          label={`Number of units ${
            receiverAssetType === 'Algo' ? 'of algo' : to.asset?.name ? `of ${to.asset.name}` : ''
          } to swap to`}
          placeholder="No. of units"
          onChange={(value) => setTo((old) => ({ ...old, numberOfUnits: Number(value) }))}
          error={toAmountError}
        />

        <Button loading={swapping} onClick={submitSwap} disabled={!canSubmit} className="mt-4">
          Initiate swap
        </Button>
      </div>
    </div>
  );
};
