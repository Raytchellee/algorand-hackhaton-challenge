'use client';

import { usePeraWallet } from '@/hooks/use-pera-wallet';
import classNames from 'classnames';
import { SelectActiveAddressModal } from '../select-active-address-modal';
import { useEffect, useState } from 'react';
import { PromptModal } from '../prompt-modal';
import { TabToggler } from '../tab-toggler';
import { useRecoilState, useRecoilValue } from 'recoil';
import { NetworkAtom, RefreshWalletAtom } from '@/state';
import { useAlgoClientConfig } from '@/hooks/use-algo-client-config';
import toast from 'react-hot-toast';
import { makePaymentTxnWithSuggestedParamsFromObject, waitForConfirmation } from 'algosdk';
import { BENEFICIARY_ADDRESS } from '@/constants/beneficiary.constant';
import { peraWallet } from '@/config/pera';
import Skeleton from 'react-loading-skeleton';
import { beautifyError } from '@/utils/beautify-error';

export const Navbar = () => {
  const { accounts, activeAddress, handleWalletConnect, handleWalletDisconnect } = usePeraWallet();
  const [disconnectPrompt, setDisconnectPrompt] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [gettingBalance, setGettingBalance] = useState(false);
  const refreshWallet = useRecoilValue(RefreshWalletAtom);
  const { algod } = useAlgoClientConfig();
  const [network, setNetwork] = useRecoilState(NetworkAtom);
  const [donating, setDonating] = useState(false);

  const isConnected = !!activeAddress;

  const getAlgoBalance = async () => {
    setBalance(null);

    if (!algod || !activeAddress) {
      return;
    }

    setGettingBalance(true);

    try {
      const accountInfo = await algod.accountInformation(activeAddress).do();
      const balance = accountInfo.amount.toString();
      setBalance(Number(balance) / 1_000_000);
    } catch (error) {
      console.error(error);
      setBalance(null);
    }

    setGettingBalance(false);
  };

  const donate = async () => {
    if (donating || !activeAddress || !algod) return;

    setDonating(true);

    toast.loading('Donating 1 Algo...', { id: 'loader' });

    const suggestedParams = await algod.getTransactionParams().do();
    const txn = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: BENEFICIARY_ADDRESS,
      amount: 1_000_000, // 1 Algo
      suggestedParams,
    });

    const txnGroup = [{ txn, signers: [activeAddress] }];

    try {
      const signedTxn = await peraWallet.signTransaction([txnGroup]);
      const txId = await algod.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(algod, txId.txId, 4);
      toast.dismiss('loader');
      toast.success(`Donation successful! Thank you for your donation of 1 algo!`);
      setDonating(false);
      getAlgoBalance();
    } catch (error) {
      toast.dismiss('loader');
      toast.error(beautifyError(`${error}`));
      setDonating(false);
    }
  };

  useEffect(() => {
    getAlgoBalance();
  }, [algod, activeAddress, refreshWallet]);

  return (
    <nav className="bg-white px-20 py-5 border-b-[1px] border-b-[#dbdada]">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn-images-1.medium.com/max/1200/1*6IXBhu4YtdCpHlWZkmWAAw.png"
              className="w-10 h-10"
            />
            <span className="text-[#383838] text-lg font-semibold">Pera Challenge</span>
          </div>
          <div>
            <TabToggler
              tabs={['Mainnet', 'Testnet']}
              selectedTab={network}
              onSelectTab={(tab) => {
                if (!gettingBalance) setNetwork(tab as any);
              }}
              theme="light"
            />
          </div>
        </div>

        <div className="flex flex-row items-center gap-3">
          {(typeof balance === 'number' || gettingBalance) && (
            <div className="p-3 bg">
              {gettingBalance ? <Skeleton width={100} /> : `Balance: ${balance}`}
            </div>
          )}
          <button
            onClick={() => {
              if (isConnected) {
                setDisconnectPrompt(true);
              } else {
                handleWalletConnect();
              }
            }}
            className={classNames(
              'rounded-full border border-solid border-transparent transition-colors flex items-center',
              'justify-center bg-foreground text-background gap-2 hover:bg-[#383838]',
              'dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5',
            )}
          >
            {isConnected ? `${activeAddress.slice(0, 10)}...` : 'Connect with Pera'}
          </button>
          {isConnected && (
            <button
              onClick={() => donate()}
              disabled={donating}
              className={classNames(
                'rounded-full border border-solid border-transparent transition-colors flex items-center',
                'justify-center bg-[#FE6746] text-background gap-2 hover:bg-[#383838]',
                'dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5',
              )}
            >
              Donate 1 ALGO
            </button>
          )}
        </div>
      </div>

      {!!accounts && accounts?.length > 1 && !activeAddress && <SelectActiveAddressModal />}

      {disconnectPrompt && (
        <PromptModal
          visible
          title="Disconnect wallet"
          description="Are you sure you want to disconnect your wallet?"
          yesButtonText="Disconnect"
          noButtonText="Cancel"
          onClose={() => setDisconnectPrompt(false)}
          yesAction={() => {
            handleWalletDisconnect();
            setDisconnectPrompt(false);
          }}
        />
      )}
    </nav>
  );
};
