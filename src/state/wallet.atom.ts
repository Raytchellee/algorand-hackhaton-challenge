import { atom } from 'recoil';

export const AddressAtom = atom<string | null>({
  key: 'active-address-atom',
  default: null,
});

export const AccountsAtom = atom<string[] | null>({
  key: 'accounts-atom',
  default: null,
});

export const NetworkAtom = atom<'Testnet' | 'Mainnet'>({
  key: 'network-atom',
  default: 'Testnet',
});

export const RefreshWalletAtom = atom<number>({
  key: 'refresh-wallet-atom',
  default: 0,
});
