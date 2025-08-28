import { Raydium } from '@raydium-io/raydium-sdk-v2';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { SOL_NETWORK } from './env.config';

export const connection = new Connection(clusterApiUrl(SOL_NETWORK == "devnet" ? "devnet" : "mainnet-beta"), 'confirmed');

let raydium: Raydium | undefined;
export const initSdk = async () => {
  if (raydium) return raydium;
  console.log(`Connecting to ${SOL_NETWORK}...`);
  raydium = await Raydium.load({
    connection,
    cluster: SOL_NETWORK == "devnet" ? "devnet" : "mainnet",
    disableFeatureCheck: true,
    disableLoadToken: false,
    blockhashCommitment: 'finalized',
  });
  return raydium;
};