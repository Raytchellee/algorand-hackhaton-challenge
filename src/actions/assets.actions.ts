import { useClient } from '@/hooks/use-client';
import { IAssetResponse } from '@/interface/asset.interface';
import { NetworkAtom } from '@/state';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue } from 'recoil';

export const useAssetActions = () => {
  const network = useRecoilValue(NetworkAtom);
  const client = useClient();

  const getVerifiedAssets = useCallback(
    async (next: string | null = null) => {
      const baseUrl =
        next ||
        `https://${network.toLowerCase()}.api.perawallet.app/v1/public/assets?filter=is_verified`;

      const response = await client.get<IAssetResponse>(baseUrl, undefined, {
        overrideDefaultBaseUrl: true,
      });

      if (response.data) {
        return response.data;
      }

      toast.error(`Failed to fetch assets: ${response.error}`);
    },
    [network],
  );

  return {
    getVerifiedAssets,
  };
};
