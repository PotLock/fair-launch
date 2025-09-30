import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { SOL_NETWORK } from './env.config';

export const connection = new Connection(clusterApiUrl(SOL_NETWORK == "devnet" ? "devnet" : "mainnet-beta"), 'confirmed');
export const txVersion = TxVersion.V0;

let raydium: Raydium | undefined;
export const initSdk = async (owner?: PublicKey, signAllTransactions?: any) => {
  if (raydium && owner && signAllTransactions) {
    raydium.setOwner(owner);
    raydium.setSignAllTransactions(signAllTransactions);
    return raydium;
  }
  console.log(`Connecting to ${SOL_NETWORK}...`);
  raydium = await Raydium.load({
    connection,
    cluster: SOL_NETWORK == "devnet" ? "devnet" : "mainnet",
    disableFeatureCheck: true,
    disableLoadToken: false,
    blockhashCommitment: 'finalized',
    owner,
    signAllTransactions,
  });
  return raydium;
};