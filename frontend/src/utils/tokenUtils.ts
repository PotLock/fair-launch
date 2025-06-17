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
      description: data.result.content.metadata.description,
      avatar: metadataJson.image,
      banner: metadataJson.banner,
      decimals: data.result.token_info.decimals,
      supply: data.result.token_info.supply / 10 ** data.result.token_info.decimals,
      mintAuthority: data.result.token_info.mint_authority,
      freezeAuthority: data.result.token_info.freeze_authority,
      createdOn: formattedDate
    };

    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}
