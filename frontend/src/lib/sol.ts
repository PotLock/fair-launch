import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SOL_NETWORK } from '../configs/env.config';

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

interface PriceCache {
  price: number;
  timestamp: number;
}

let solPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export const getSolPrice = async (): Promise<number | null> => {
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

export const getRpcSOLEndpoint = (): string => {  
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
export const getSolBalance = async (walletAddress: string): Promise<number> => {
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
    throw new Error(`Failed to get SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get token balance for a specific token mint and wallet address
 * @param tokenMintAddress - The token mint address
 * @param walletAddress - The wallet address to get token balance for
 * @returns The token balance
 */
export const getTokenBalanceOnSOL = async (tokenMintAddress: string, walletAddress: string): Promise<number> => {
  try {
    const connection = new Connection(getRpcSOLEndpoint());
    const walletPublicKey = new PublicKey(walletAddress);
    
    if (!PublicKey.isOnCurve(walletPublicKey)) {
      throw new Error('Invalid wallet address');
    }

    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    // Find the token account for the specific mint
    const tokenAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === tokenMintAddress
    );

    if (!tokenAccount) {
      return 0; // No token account found for this mint
    }

    const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
    return balance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
