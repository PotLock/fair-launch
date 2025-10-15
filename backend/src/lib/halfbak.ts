import type { TokenMetadata as SdkTokenMetadata } from '@cookedbusiness/halfbaked-sdk';
import { Keypair, PublicKey } from '@solana/web3.js';
import type {
  DbcConfigRequest,
  DbcConfigRequestType,
  DeployTokenRequest,
  DeployTokenRequestType,
  TokenMetadata,
  TokenMetadataRequest,
} from '../types';

export const fromRequestMetadata = (metadata: TokenMetadataRequest): TokenMetadata => ({
  name: metadata.name,
  symbol: metadata.symbol,
  description: metadata.description,
  imageUri: metadata.imageUri ?? '',
  bannerUri: metadata.bannerUri ?? '',
  website: metadata.website ?? '',
  twitter: metadata.twitter ?? '',
  telegram: metadata.telegram ?? '',
});

export const toSdkMetadata = (metadata: TokenMetadata): SdkTokenMetadata => ({
  imageUri: metadata.imageUri ?? '',
  bannerUri: metadata.bannerUri ?? '',
  description: metadata.description,
  website: metadata.website ?? '',
  twitter: metadata.twitter ?? '',
  telegram: metadata.telegram ?? '',
});

export const buildDbcConfigRequest = (request: DbcConfigRequestType): DbcConfigRequest => ({
  metadata: fromRequestMetadata(request.metadata),
  signer: new PublicKey(request.signer),
});

export const buildDeployTokenRequest = (request: DeployTokenRequestType): DeployTokenRequest => {
  // Convert the object format to Uint8Array
  const secretKeyArray = Object.values(request.dbcConfigKeypair.secretKey);
  
  return {
    metadata: fromRequestMetadata(request.metadata),
    signer: new PublicKey(request.signer),
    dbcConfigKeypair: Keypair.fromSecretKey(Uint8Array.from(secretKeyArray)),
  };
};
