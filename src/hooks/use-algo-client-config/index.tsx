'use client';

import { ALGO_CLIENT_CONFIG } from '@/constants';
import { ClientConfig, NetworkEnvironment } from '@/interface';
import { NetworkAtom } from '@/state';
import algosdk from 'algosdk';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

export const useAlgoClientConfig = () => {
  const network = useRecoilValue(NetworkAtom);
  const [algod, setAlgodClient] = useState<algosdk.Algodv2>();
  const [config, setConfig] = useState<ClientConfig>();

  const getAlgoClientConfig = () => {
    let environment: NetworkEnvironment = 'TestNet';

    if (network === 'Mainnet') {
      environment = 'MainNet';
    }

    return {
      environment,
      config: ALGO_CLIENT_CONFIG[environment],
    };
  };

  useEffect(() => {
    const { config } = getAlgoClientConfig();
    setConfig(config);
    const algodConfig = config.algod;
    const client = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port);
    setAlgodClient(client);
  }, [network]);

  return {
    algod,
    networkConfig: config,
  };
};
