import {
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature
} from "@solana/web3.js";
import BN from "bn.js";
import * as fs from "fs";
import { DEFAULT_AIRDROP_AMOUNT, DEFAULT_RPC, DEFAULT_TOKEN_DECIMALS } from './constants';
import { logger } from './logger';
import { Result, TokenInfo, Wallet } from './types';

export const connection = new Connection(DEFAULT_RPC, "confirmed");


export const isValidPublicKey = (address: string): boolean => {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey);
  } catch {
    return false;
  }
};

export const validateTokenAddress = (address: string, context: string): void => {
  if (!isValidPublicKey(address)) {
    throw new Error(`Invalid token address in ${context}: ${address}`);
  }
};

export const bnToBuffer = (bn: BN, length: number = 8): Buffer => {
  const buffer = Buffer.alloc(length);
  bn.toArrayLike(Buffer, 'le', length).copy(buffer);
  return buffer;
};

export const numberToBN = (num: number, decimals: number = DEFAULT_TOKEN_DECIMALS): BN => {
  return new BN(Math.floor(num * Math.pow(10, decimals)));
};

export const bnToNumber = (bn: BN, decimals: number = DEFAULT_TOKEN_DECIMALS): number => {
  return bn.toNumber() / Math.pow(10, decimals);
};

export const loadWalletKey = (keypairPath: string): Keypair => {
  try {
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    logger.error("Failed to load wallet key", {
      path: keypairPath,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Failed to load wallet key from ${keypairPath}: ${error}`);
  }
};

export async function getTokenBalance(tokenMint: string, walletAddress: string): Promise<number> {
  try {
    validateTokenAddress(tokenMint, "tokenMint");
    validateTokenAddress(walletAddress, "walletAddress");

    const mint = new PublicKey(tokenMint);
    const wallet = new PublicKey(walletAddress);
    const tokenAccount = getAssociatedTokenAddressSync(mint, wallet);

    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      // Token account doesn't exist
      logger.debug("Token account not found", { tokenMint, walletAddress });
      return 0;
    }
  } catch (error) {
    logger.error("Error getting token balance", {
      tokenMint,
      walletAddress,
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

export async function airdropSol(
  walletAddress: string,
  amount: number = DEFAULT_AIRDROP_AMOUNT
): Promise<Result<TransactionSignature>> {
  try {
    validateTokenAddress(walletAddress, "walletAddress");

    if (amount <= 0 || amount > 10) {
      return {
        success: false,
        error: new Error("Airdrop amount must be between 0 and 10 SOL")
      };
    }

    const wallet = new PublicKey(walletAddress);
    const lamports = amount * LAMPORTS_PER_SOL;

    logger.info("Requesting SOL airdrop", {
      walletAddress,
      amount,
      lamports
    });

    const signature = await connection.requestAirdrop(wallet, lamports);
    await connection.confirmTransaction(signature, "confirmed");

    logger.info("SOL airdrop successful", {
      walletAddress,
      amount,
      signature
    });

    return { success: true, data: signature };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to airdrop SOL", {
      walletAddress,
      amount,
      error: errorMessage
    });
    return {
      success: false,
      error: error instanceof Error ? error : new Error(errorMessage)
    };
  }
}

export async function createDummyToken(
  name: string,
  symbol: string,
  decimals: number = DEFAULT_TOKEN_DECIMALS,
  initialSupply: number = 1000000,
  wallet: Wallet
): Promise<Result<TokenInfo>> {
  try {
    if (!name || !symbol) {
      return {
        success: false,
        error: new Error("Token name and symbol are required")
      };
    }

    if (decimals < 0 || decimals > 9) {
      return {
        success: false,
        error: new Error("Decimals must be between 0 and 9")
      };
    }

    if (initialSupply < 0) {
      return {
        success: false,
        error: new Error("Initial supply must be positive")
      };
    }

    logger.info("Creating dummy token", {
      name,
      symbol,
      decimals,
      initialSupply,
      wallet: wallet.publicKey.toBase58()
    });

    // Create mint
    const mint = await createMint(
      connection,
      wallet as any, // Type assertion for compatibility
      wallet.publicKey,
      wallet.publicKey,
      decimals
    );

    // Get or create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet as any,
      mint,
      wallet.publicKey
    );

    // Mint initial supply
    if (initialSupply > 0) {
      const mintAmount = initialSupply * Math.pow(10, decimals);
      await mintTo(
        connection,
        wallet as any,
        mint,
        tokenAccount.address,
        wallet.publicKey,
        mintAmount
      );
    }

    const tokenInfo: TokenInfo = {
      mint,
      name,
      symbol,
      decimals,
      supply: initialSupply
    };

    logger.info("Dummy token created successfully", {
      mint: mint.toBase58(),
      name,
      symbol,
      decimals,
      initialSupply,
      tokenAccount: tokenAccount.address.toBase58()
    });

    return { success: true, data: tokenInfo };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create dummy token", {
      name,
      symbol,
      decimals,
      initialSupply,
      wallet: wallet.publicKey.toBase58(),
      error: errorMessage
    });
    return {
      success: false,
      error: error instanceof Error ? error : new Error(errorMessage)
    };
  }
}
