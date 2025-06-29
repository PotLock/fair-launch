import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import dotenv from 'dotenv';

dotenv.config();

const heliusApiKey = process.env.PUBLIC_HELIUS_API_KEY;

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
  avatar: string;
  banner?: string;
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
}

export interface BondingCurveTokenInfo {
  creator: string;
  totalSupply: number;
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
  if (!heliusApiKey) {
    throw new Error('HELIUS_API_KEY is not defined in environment variables');
  }

  const SOLANA_DEVNET_RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;
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
      avatar: metadataJson.image,
      banner: metadataJson.banner,
      decimals: data.result.token_info.decimals,
      supply: data.result.token_info.supply / 10 ** data.result.token_info.decimals,
      mintAuthority: data.result.token_info.mint_authority,
      freezeAuthority: data.result.token_info.freeze_authority,
      createdOn: formattedDate,
      social: metadataJson.social,
      pricing: metadataJson.pricing
    };

    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function getAllTokensCreatedByBondingCurve(): Promise<string[]> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  try {
    // Get all accounts owned by the bonding curve program
    const programId = new PublicKey('2133PDFLFMiJyzqKU55up2wThH68QjVFjtrtC5Mx91TY');
    
    // Get all program accounts
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          dataSize: 48, // Size of BondingCurve account (8 bytes discriminator + 40 bytes data)
        }
      ]
    });

    console.log(`Found ${accounts.length} bonding curve accounts`);

    const mintAddresses: string[] = [];

    for (const account of accounts) {
      try {
        // The bonding curve account stores the token mint address
        // We need to extract it from the account data
        const accountData = account.account.data;
        
        // Skip discriminator (8 bytes)
        const dataWithoutDiscriminator = accountData.slice(8);
        
        // The token mint address is stored in the account data
        // For BondingCurve account, the token field is at a specific offset
        // This is a simplified approach - you might need to adjust based on actual data layout
        if (dataWithoutDiscriminator.length >= 32) {
          // Extract the token mint address (assuming it's stored as a PublicKey)
          const tokenMintBytes = dataWithoutDiscriminator.slice(16, 48); // Adjust offset as needed
          const tokenMint = new PublicKey(tokenMintBytes);
          mintAddresses.push(tokenMint.toString());
        }
      } catch (error) {
        console.error('Error processing account:', account.pubkey.toString(), error);
        continue;
      }
    }

    console.log(`Extracted ${mintAddresses.length} mint addresses`);
    return mintAddresses;
  } catch (error) {
    console.error('Error fetching all bonding curve tokens:', error);
    return [];
  }
}

export async function getAllTokensCreatedByBondingCurveWithDetails(): Promise<{
  mintAddress: string;
  bondingCurveAccount: string;
  creator?: string;
}[]> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  try {
    // Get all accounts owned by the bonding curve program
    const programId = new PublicKey('2133PDFLFMiJyzqKU55up2wThH68QjVFjtrtC5Mx91TY');
    
    // Get all program accounts
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          dataSize: 48, // Size of BondingCurve account
        }
      ]
    });

    console.log(`Found ${accounts.length} bonding curve accounts`);

    const tokenDetails: {
      mintAddress: string;
      bondingCurveAccount: string;
      creator?: string;
    }[] = [];

    for (const account of accounts) {
      try {
        const accountData = account.account.data;
        const dataWithoutDiscriminator = accountData.slice(8);
        
        if (dataWithoutDiscriminator.length >= 32) {
          // Extract token mint address
          const tokenMintBytes = dataWithoutDiscriminator.slice(16, 48); // Adjust offset as needed
          const tokenMint = new PublicKey(tokenMintBytes);
          
          // Extract creator address (first 32 bytes after discriminator)
          const creatorBytes = dataWithoutDiscriminator.slice(0, 32);
          const creator = new PublicKey(creatorBytes);
          
          tokenDetails.push({
            mintAddress: tokenMint.toString(),
            bondingCurveAccount: account.pubkey.toString(),
            creator: creator.toString()
          });
        }
      } catch (error) {
        console.error('Error processing account:', account.pubkey.toString(), error);
        continue;
      }
    }

    console.log(`Extracted ${tokenDetails.length} token details`);
    return tokenDetails;
  } catch (error) {
    console.error('Error fetching all bonding curve tokens with details:', error);
    return [];
  }
}

