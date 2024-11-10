'use client';

import { useAssetActions } from '@/actions/assets.actions';
import { AssetCard } from './asset-card';
import { AssetCardLoader } from './asset-card-loader';
import { useEffect, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { NetworkAtom, RefreshWalletAtom } from '@/state';
import { IAssetResponse } from '@/interface/asset.interface';

export const Assets = () => {
  const { getVerifiedAssets } = useAssetActions();
  const network = useRecoilValue(NetworkAtom);
  const [loading, setLoading] = useState(false);
  const [assetsRes, setAssetsRes] = useState<IAssetResponse>({
    next: null,
    previous: null,
    results: [],
  });
  const [observerIntersected, setObserverIntersected] = useState(0);

  const fetchAssets = async (append?: boolean) => {
    if (!append) {
      setAssetsRes({
        next: null,
        previous: null,
        results: [],
      });
    }

    if (append && !assetsRes.next) {
      return;
    }

    setLoading(true);
    const response = await getVerifiedAssets(append ? assetsRes.next : null);
    setLoading(false);

    if (response) {
      setAssetsRes((prev) => ({
        ...response,
        results: append ? [...prev.results, ...response.results] : response.results,
      }));
    }
  };

  /**
   * This creates an intersection observer that detects when the user
   * scrolls to the bottom of the assets list. When the user scrolls to the
   * bottom of the assets list, fetchAssets is triggered to retrieve more
   * assets to display.
   */
  const createIntersectionObserver = () => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && entry?.intersectionRatio > 0) {
        setObserverIntersected((old) => {
          return old + 0.5;
        });
      }
    }, options);

    const element = document.getElementById('intersection_observer');

    if (element) observer.observe(element);
  };

  useEffect(() => {
    fetchAssets();
  }, [network]);

  useEffect(() => {
    createIntersectionObserver();
  }, []);

  useEffect(() => {
    if (!loading && !!assetsRes.next) {
      fetchAssets(true);
    }
  }, [observerIntersected]);

  return (
    <div className="flex flex-col">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}
      >
        {assetsRes.results?.map((asset) => (
          <AssetCard key={asset.asset_id} data={asset} />
        ))}
        {loading && Array.from({ length: 10 }).map((_, index) => <AssetCardLoader key={index} />)}
      </div>
      <div id="intersection_observer" className={'min-h-4 w-[100%] mb-4'} />
    </div>
  );
};
