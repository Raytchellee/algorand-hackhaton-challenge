import { SignerTransaction } from '@perawallet/connect/dist/util/model/peraWalletModels';
import algosdk from 'algosdk';

export async function generateOptIntoAssetTxn({
  assetID,
  initiatorAddr,
  algod,
}: {
  assetID: number;
  initiatorAddr: string;
  algod: algosdk.Algodv2;
}): Promise<SignerTransaction[]> {
  const suggestedParams = await algod.getTransactionParams().do();
  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: initiatorAddr,
    to: initiatorAddr,
    assetIndex: assetID,
    amount: 0,
    suggestedParams,
  });

  return [{ txn: optInTxn, signers: [initiatorAddr] }];
}

export async function generatePaymentTxn({
  to,
  initiatorAddr,
  amount,
  algod,
}: {
  to: string;
  initiatorAddr: string;
  amount: number;
  algod: algosdk.Algodv2;
}): Promise<SignerTransaction[]> {
  const suggestedParams = await algod.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: initiatorAddr,
    to,
    amount,
    suggestedParams,
  });

  return [{ txn, signers: [initiatorAddr] }];
}

export async function generateAssetTransferTxn({
  to,
  assetID,
  initiatorAddr,
  amount,
  algod,
}: {
  to: string;
  assetID: number;
  initiatorAddr: string;
  amount: number;
  algod: algosdk.Algodv2;
}): Promise<SignerTransaction[]> {
  const suggestedParams = await algod.getTransactionParams().do();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: initiatorAddr,
    to,
    assetIndex: assetID,
    amount,
    suggestedParams,
  });

  return [{ txn, signers: [initiatorAddr] }];
}
