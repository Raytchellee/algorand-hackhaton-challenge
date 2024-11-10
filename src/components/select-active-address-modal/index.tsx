'use client';

import { useState } from 'react';
import { BackgroundOverlay } from '../background-overlay';
import styles from './index.module.scss';
import { usePeraWallet } from '@/hooks/use-pera-wallet';
import classNames from 'classnames';

export const SelectActiveAddressModal = () => {
  const { accounts, setActiveAddress, handleWalletDisconnect } = usePeraWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  return (
    <BackgroundOverlay>
      <div className={styles.container}>
        <div className={styles.title}>
          <h4>Select Wallet</h4>
          <h5>Please select the account you would like to proceed with</h5>
        </div>
        <div className={styles.wallets}>
          {accounts?.map((wallet) => (
            <div className={styles.wallet} key={wallet} onClick={() => setSelectedWallet(wallet)}>
              <span
                className={
                  wallet === selectedWallet
                    ? 'font-[700] text-[#171717]'
                    : 'font-[500] text-[#6b6b6b]'
                }
              >
                {wallet.slice(0, 10)}...{wallet.slice(wallet.length - 10)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-row gap-4">
          <button
            className={classNames(
              'rounded-full border border-solid border-[#383838] transition-colors flex items-center',
              'justify-center bg-white text-[#383838] gap-2 hover:bg-[#383838]',
              'text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:text-white flex-1',
            )}
            onClick={handleWalletDisconnect}
          >
            Disconnect
          </button>
          <button
            className={classNames(
              'rounded-full border border-solid border-transparent transition-colors flex items-center',
              'justify-center bg-foreground text-background gap-2 hover:bg-[#383838]',
              'text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5',
              'disabled:opacity-50 flex-1',
            )}
            disabled={!selectedWallet}
            onClick={() => setActiveAddress(selectedWallet)}
          >
            Continue
          </button>
        </div>
      </div>
    </BackgroundOverlay>
  );
};
