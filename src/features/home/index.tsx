'use client';

import styles from './index.module.scss';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Navbar } from '@/components/navbar';
import { AddressAtom } from '@/state';
import { useState } from 'react';
import { TabToggler } from '@/components/tab-toggler';
import { Assets } from './assets';
import { AtomicSwap } from './atomic-swap';

export const Home = () => {
  const activeAddress = useRecoilValue(AddressAtom);
  const isConnected = !!activeAddress;
  const [view, setView] = useState<'Assets' | 'Atomic Swap'>('Assets');

  return (
    <div className={styles.container}>
      <Navbar />
      {isConnected ? (
        <main className="container px-10 mx-auto flex flex-col gap-4">
          <TabToggler
            tabs={['Assets', 'Atomic Swap']}
            selectedTab={view}
            onSelectTab={(tab) => setView(tab as any)}
            theme="light"
          />
          <div className={view === 'Assets' ? 'flex flex-col w-[100%]' : 'hidden'}>
            <Assets />
          </div>
          <div className={view === 'Atomic Swap' ? 'flex-col' : 'hidden'}>
            <AtomicSwap />
          </div>
        </main>
      ) : (
        <main className="flex flex-col items-center justify-center px-20 self-center">
          <div className="py-10 flex flex-col gap-4">
            <p className="text-4xl">Welcome.</p>
            <p className="text-xl">{`Get started by connecting your wallet.`}</p>
          </div>
        </main>
      )}
    </div>
  );
};
