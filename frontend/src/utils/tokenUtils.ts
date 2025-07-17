import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { HELIUS_API_KEY } from '../configs/env.config';
import idlBondingCurve from "../contracts/IDLs/bonding_curve.json";
import { 
  ALLOCATION_SEED_PREFIX, 
  deserializeAllocationAndVesting, 
  deserializeBondingCurve
} from './sol';


export interface MintAccount {
  mint: string;
  balance: number;
  decimals: number;
  tokenAccount: string;
}

export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  avatarUrl: string;
  bannerUrl?: string;
  description: string;
  decimals: number;
  supply: number;
  mintAuthority: string;
  freezeAuthority: string;
  createdOn: string;
  social: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    farcaster?: string;
  }
  pricing: string;
  curveConfig?: string;
  mintAddress?: string;
  targetRaise?: string;
  createdAt?: string;
  selectedPricing?: string;
  selectedExchange?: string;
  selectedTemplate?: string;
  hardCap?: string;
  maximumContribution?: string;
  minimumContribution?: string;
  launchLiquidityOnName?: string;
  reserveRatio?: string;
  initialPrice?: string;
}

export interface BondingCurveTokenInfo {
  creator: string;
  totalSupply: number;
  reserveRatio: number;
  reserveBalance: number;
  reserveToken: number;
  token: string;
  bump: number;
}

export interface LaunchPadTokenInfo {
  authority: string;
  tokenMint: string;
  startTime: number;
  endTime: number;
  vault: string;
  launchType: 'Whitelist' | 'FairLaunch';
  whitelistData?: string;
  fairLaunchData?: string;
  bump: number;
}

export interface FairLaunchData {
  launchpad: string;
  vault: string;
  softCap: number;
  hardCap: number;
  minContribution: number;
  maxContribution: number;
  maxTokensPerWallet: number;
  distributionDelay: number;
  totalRaised: number;
  paused: boolean;
  bump: number;
}

export interface WhitelistLaunchData {
  launchpad: string;
  tokenPrice: number;
  purchaseLimitPerWallet: number;
  totalSupply: number;
  soldTokens: number;
  whitelistedUsers: string[];
  buyers: string[];
  paused: boolean;
  whitelistDuration: number;
  bump: number;
}

const connection = new Connection("https://api.devnet.solana.com", {
  commitment: "confirmed",
});

const programId = new PublicKey(idlBondingCurve.address);

export async function getMintAccounts(walletAddress: string): Promise<MintAccount[]> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  try {
    const publicKey = new PublicKey(walletAddress);

    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const listMintAccounts: MintAccount[] = [];

    for (const account of tokenAccounts.value) {
      const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
      const parsedInfo = accountInfo.value?.data as ParsedAccountData;

      if (parsedInfo) {
        const mint = parsedInfo.parsed.info.mint; // Token mint address
        const balance = parsedInfo.parsed.info.tokenAmount.uiAmount; // Balance in human-readable format
        const decimals = parsedInfo.parsed.info.tokenAmount.decimals; // Token decimals

        listMintAccounts.push({
          mint,
          balance,
          decimals,
          tokenAccount: account.pubkey.toBase58(),
        });
      }
    }

    return listMintAccounts;
  } catch (error) {
    console.error('Error fetching mint accounts:', error);
    throw error;
  }
}

export async function getTokenInfo(mint: string): Promise<TokenInfo> {
  if (!HELIUS_API_KEY) {
    throw new Error('HELIUS_API_KEY is not defined in environment variables');
  }

  const SOLANA_DEVNET_RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  try {
    // Get token creation time
    const mintPubkey = new PublicKey(mint);
    const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit: 1 });
    const creationTime = signatures.length > 0 
      ? new Date(signatures[0].blockTime! * 1000)
      : new Date();
    
    const formattedDate = creationTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const response = await fetch(SOLANA_DEVNET_RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAsset',
        params: { id: mint }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius API error: ${data.error.message}`);
    }

    const metadata = await fetch(data.result.content.json_uri);
    const metadataJson = await metadata.json();
    
    const tokenInfo: TokenInfo = {
      id: data.result.id,
      name: data.result.content.metadata.name,
      symbol: data.result.content.metadata.symbol,
      description: metadataJson.description,
      avatarUrl: metadataJson.image,
      bannerUrl: metadataJson.banner,
      decimals: data.result.token_info.decimals,
      supply: data.result.token_info.supply / 10 ** data.result.token_info.decimals,
      mintAuthority: data.result.token_info.mint_authority,
      freezeAuthority: data.result.token_info.freeze_authority,
      createdOn: formattedDate,
      social: metadataJson.social,
      pricing: metadataJson.pricing,
    };

    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function getBondingCurveAccounts(mint: PublicKey) {
  const seeds = [Buffer.from("bonding_curve"), mint.toBuffer()];

  const [bondingCurve, bump] = PublicKey.findProgramAddressSync(seeds, programId);

  const accountInfo = await connection.getAccountInfo(bondingCurve);

  if (!accountInfo) {
    console.log("PDA account does not exist or has no data.");
    return;
  }

  const decodedData = deserializeBondingCurve(accountInfo.data);
  return decodedData;
}

export async function getAllocationsAndVesting(wallets: PublicKey[]) {
  for (const wallet of wallets) {
    const seeds = [Buffer.from(ALLOCATION_SEED_PREFIX), wallet.toBuffer()];
    const [allocation, bump] = PublicKey.findProgramAddressSync(seeds, programId);

    console.log("PDA Address:", allocation.toBase58());

    const accountInfo = await connection.getAccountInfo(allocation);

    if (!accountInfo) {
      console.log("PDA account does not exist or has no data.");
      return;
    }

    const decodedData = deserializeAllocationAndVesting(accountInfo.data);
    return decodedData;
  }
}

// Get all holders of a token by mint address on Solana
export async function getTokenHoldersByMint(mintAddress: string) {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  try {
    // Get all token accounts owned by all owners for this mint
    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        { dataSize: 165 }, // size of token account
        { memcmp: { offset: 0, bytes: mintAddress } }, // mint address is at offset 0
      ],
    });
    // Map to owner and amount
    const holders = accounts
      .map((account: any) => {
        const data = account.account.data as Buffer;
        const owner = new PublicKey(data.slice(32, 64)).toBase58();
        const amount = Number(data.readBigUInt64LE(64));
        return { owner, amount };
      })
      // Only include holders with a positive balance
      .filter((holder: { owner: string; amount: number }) => holder.amount && holder.amount > 0);
    return holders;
  } catch (error) {
    console.error('Error fetching token holders:', error);
    throw error;
  }
}


