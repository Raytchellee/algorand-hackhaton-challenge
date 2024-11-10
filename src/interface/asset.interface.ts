export interface IAsset {
  asset_id: number;
  name: string;
  unit_name: string;
  fraction_decimals: number;
  total_supply: number;
  is_deleted: boolean;
  creator_address: string;
  url: string;
  logo: string;
  verification_tier: 'verified';
  usd_value: string | null;
  is_collectible: boolean;
}

export interface IAssetResponse {
  next: string | null;
  previous: string | null;
  results: IAsset[];
}

export interface IAccountAssetInformation {
  amount: number;
  'asset-id': number;
  'is-frozen': boolean;
}

export interface IAccountAssetInformationExtended extends IAccountAssetInformation {
  name: string;
  'unit-name': string;
  creator: string;
  decimals: number;
}
