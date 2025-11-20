import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { HELIUS_API_KEY, SOL_NETWORK } from '../configs/env.config';
import { deserializeMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { getIpfsUrl } from './utils';

const URL_API = "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT";
const FALLBACK_URL_API = "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=SOL-USDT";

interface PriceCache {
  price: number;
  timestamp: number;
}


export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  balance: number;
  decimals: number;
  tokenAccount: string;
}


let solPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const getSolPrice = async (): Promise<number | null> => {
  try {
    const res = await fetch(URL_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const price = parseFloat(data.price);
    
    // Update cache with new price
    solPriceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (primaryError) { 
    try {
      const fallbackRes = await fetch(FALLBACK_URL_API);
      if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
      const fallbackData = await fallbackRes.json();
      const price = parseFloat(fallbackData?.data?.price);

      if (Number.isNaN(price)) {
        throw new Error('Fallback price parsing failed');
      }

      solPriceCache = {
        price,
        timestamp: Date.now()
      };

      return price;
    } catch (fallbackError) {
      console.error('Error fetching SOL price:', primaryError, fallbackError);
    }
    
    if (solPriceCache && (Date.now() - solPriceCache.timestamp) < CACHE_DURATION) {
      return solPriceCache.price;
    }
    
    return null;
  }
}

export const getRpcSOLEndpoint = (): string => {  
  switch (SOL_NETWORK) {
    case 'mainnet':
      return `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    case 'testnet':
      return `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    default:
      return `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
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


/**
 * Get all tokens for a Solana account
 * @param walletAddress - The wallet address to get tokens for
 * @returns Array of token information including metadata
 */
export async function getAllTokens(walletAddress: string): Promise<TokenInfo[]> {
  try {
    const connection = new Connection(getRpcSOLEndpoint());
    const publicKey = new PublicKey(walletAddress);
    
    if (!PublicKey.isOnCurve(publicKey)) {
      throw new Error('Invalid wallet address');
    }

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );
    
    const tokens: TokenInfo[] = [];
    
    // Process each token account (limit to 10)
    const limitedTokenAccounts = tokenAccounts.value.slice(0, 30);
    for (const { account, pubkey } of limitedTokenAccounts) {
      const accountInfo = account.data.parsed.info;
      const mint = accountInfo.mint;
      const balance = accountInfo.tokenAmount.uiAmount;
      const decimals = accountInfo.tokenAmount.decimals;

      // Skip if balance is 0
      if (balance === 0) {
        continue;
      }

      // Get token metadata
      const metadata = await getTokenMetadata(mint);
      tokens.push({
        mint,
        name: metadata?.name || 'Unknown Token',
        symbol: metadata?.symbol || 'UNKNOWN',
        image: metadata?.image,
        balance,
        decimals,
        tokenAccount: pubkey.toString()
      });
    }
    
    tokens.sort((a, b) => b.balance - a.balance);
    
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      walletAddress,
      network: SOL_NETWORK,
      rpcEndpoint: getRpcSOLEndpoint()
    });
    throw new Error(`Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  image?: string;
  decimals: number;
}

/**
 * Get token metadata from Metaplex metadata program
 */
async function getTokenMetadata(mint: string): Promise<TokenMetadata | null> {
  try {
    const connection = new Connection(getRpcSOLEndpoint());
    const mintPublicKey = new PublicKey(mint);
    
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);

    if (!accountInfo?.data) {
      console.warn(`Token metadata account not found for mint ${mint}`);
      return null;
    }
    
    //@ts-ignore
    const metadata = deserializeMetadata(accountInfo);
    let imageUrl: string | undefined;
    try {
      const imageResponse = await fetch(getIpfsUrl(metadata.uri));
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData?.image;
      }
    } catch (fetchError) {
      console.warn(`Unable to fetch metadata JSON for mint ${mint}`, fetchError);
    }
    
    return {
      name: metadata.name.replace(/\0/g, ''),
      symbol: metadata.symbol.replace(/\0/g, ''),
      image: imageUrl,
      decimals: 0
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}