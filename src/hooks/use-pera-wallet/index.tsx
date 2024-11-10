'use client';

import { peraWallet } from '@/config/pera';
import { AccountsAtom, AddressAtom } from '@/state';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRecoilState } from 'recoil';

export const usePeraWallet = () => {
  const [activeAddress, setActiveAddress] = useRecoilState(AddressAtom);
  const [accounts, setAccounts] = useRecoilState(AccountsAtom);

  const handleWalletConnect = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccounts(accounts);
      peraWallet.connector?.on('disconnect', handleWalletDisconnect);

      if (accounts.length === 1) {
        setActiveAddress(accounts[0]);
      }
    } catch (error: any) {
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        toast.error(error?.toString());
      }
    }
  };

  const handleWalletDisconnect = () => {
    peraWallet.disconnect();
    setActiveAddress(null);
    setAccounts(null);
  };

  const handleWalletReconnect = async () => {
    try {
      const accounts = await peraWallet.reconnectSession();
      peraWallet.connector?.on('disconnect', handleWalletDisconnect);

      if (peraWallet.isConnected && accounts.length) {
        setAccounts(accounts);

        if (accounts.length === 1) {
          setActiveAddress(accounts[0]);
        }
      }
    } catch (error: any) {
      toast.error(error?.toString());
    }
  };

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    handleWalletReconnect();
  }, []);

  return {
    handleWalletConnect,
    handleWalletDisconnect,
    activeAddress,
    accounts,
    setActiveAddress,
    setAccounts,
    peraWallet,
  };
};
