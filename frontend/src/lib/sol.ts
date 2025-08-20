import { Connection, PublicKey } from '@solana/web3.js';
import { SOL_NETWORK } from '../configs/env.config';

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

interface PriceCache {
  price: number;
  timestamp: number;
}

let solPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const getSolPrice = async (): Promise<number | null> => {
  try {
    const res = await fetch(URL_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const price = data.solana.usd;
    
    // Update cache with new price
    solPriceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (err) { 
    if (solPriceCache && (Date.now() - solPriceCache.timestamp) < CACHE_DURATION) {
      return solPriceCache.price;
    }
    
    return null;
  }
}

const getRpcSOLEndpoint = (): string => {  
  switch (SOL_NETWORK) {
    case 'mainnet':
      return 'https://api.mainnet-beta.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    default:
      return 'https://api.devnet.solana.com';
  }
}


/**
 * Get SOL balance for a wallet address
 * @param walletAddress - The wallet address to get SOL balance for
 * @returns The SOL balance in SOL units
 */
const getSolBalance = async (walletAddress: string): Promise<number> => {
  try {
    const connection = new Connection(getRpcSOLEndpoint());
    const publicKey = new PublicKey(walletAddress);
    
    if (!PublicKey.isOnCurve(publicKey)) {
      throw new Error('Invalid wallet address');
    }

    const balance = await connection.getBalance(publicKey);
    
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const solBalance = balance / 1_000_000_000;
    
    return solBalance;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      walletAddress,
      network: SOL_NETWORK,
      rpcEndpoint: getRpcSOLEndpoint()
    });
    throw new Error(`Failed to get SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export {
  getRpcSOLEndpoint,
  getSolBalance,
  getSolPrice
}