import { clusterApiUrl, Connection, Keypair, PublicKey, Signer, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { BondingCurve } from "../target/types/bonding_curve"
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import fs from "fs";
import { VaultMeteora, IDL } from "../idls/vault_meteora";

import {
  PROGRAM_ID as VAULT_PROGRAM_ID,
  getVaultPdas
} from '@mercurial-finance/vault-sdk';
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

export const CURVE_CONFIGURATION_SEED = "curve_configuration"
const POOL_SEED_PREFIX = "bonding_curve"
const SOL_VAULT_PREFIX = "liquidity_sol_vault"
export const FEE_POOL_SEED_PREFIX = "fee_pool"
const FEE_POOL_VAULT_PREFIX = "fee_pool_vault"
const TOKEN_VAULT_PREFIX = "token_vault"
// Meteora 
const POOL_METEORA_PREFIX = "pool"
const PROTOCOL_FEE_PREFIX = "fee"
const LP_MINT_PREFIX = "lp_mint"
const VAULT_PREFIX = "vault"
const LOCK_ESCROW_PREFIX = "lock_escrow"

export const METEORA_PROGRAM_ID = new PublicKey("Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB")
export const METEORA_VAULT_PROGRAM_ID = new PublicKey(VAULT_PROGRAM_ID);
export const METAPLEX_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Need to create config pool 

export const TEST_CONFIG = new PublicKey("BdfD7rrTZEWmf8UbEBPVpvM3wUqyrR8swjAy5SNT8gJ2")


// PumpSwap
const POOL_PUMP_SWAP_PREFIX = "pool"
export const PUMP_SWAP_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA")
const program = anchor.workspace.BondingCurve as Program<BondingCurve>;


const connection = new Connection(clusterApiUrl("devnet"),'confirmed')


export function getPDAs(user: PublicKey, mint: PublicKey){
  const [curveConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(CURVE_CONFIGURATION_SEED)],
    program.programId,
    
  );

  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
    program.programId
  );

  const [poolSolVault, poolSolVaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(SOL_VAULT_PREFIX), mint.toBuffer()],
    program.programId
  );
  
  // const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
  //   connection, payer, mint, bondingCurve, true,'confirmed', null , TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
  // )
  // console.log("Pool Token Account : ", poolTokenAccount)
  // const [poolTokenAccount] = PublicKey.findProgramAddressSync(
  //   [Buffer.from(TOKEN_VAULT_PREFIX), bondingCurve.toBuffer(), mint.toBuffer()],
  //   program.programId
  // )

  const poolTokenAccount = getAssociatedTokenAddressSync(
    mint, bondingCurve, true
  )


  // const userTokenAccount = await getOrCreateAssociatedTokenAccount(
  //   connection, payer, mint, user, true,'confirmed', null, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
  // )

  const userTokenAccount = getAssociatedTokenAddressSync(
    mint, user, true
  )


  const [feePool] = PublicKey.findProgramAddressSync(
    [Buffer.from(FEE_POOL_SEED_PREFIX)],
    
    program.programId
  )

  const [feePoolVault, feePoolVaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(FEE_POOL_VAULT_PREFIX), mint.toBuffer()],
    program.programId
  )

  return {
    userTokenAccount,
    curveConfig,
    bondingCurve,
    poolSolVault,
    poolSolVaultBump,
    poolTokenAccount,
    feePool,
    feePoolVault,
    feePoolVaultBump
  };
}

// export function associatedAddress({
//   mint,
//   owner,
// }: {
//   mint: PublicKey;
//   owner: PublicKey;
// }): PublicKey {
//   return PublicKey.findProgramAddressSync(
//     [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
//     ASSOCIATED_PROGRAM_ID
//   )[0];
// }

export async function getPoolTokenAccount2022(payer: Signer, mint: PublicKey, bondingCurve: PublicKey){
  const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection, payer, mint, bondingCurve, true,'confirmed', null , TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return poolTokenAccount
}

export async function getUserTokenAccount2022(payer: Signer, mint: PublicKey, user: PublicKey){
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection, payer, mint, user, true,'confirmed', null , TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return userTokenAccount
}



export async function getMeteoraPDA(tokenAMint: PublicKey, tokenBMint: PublicKey, payer: PublicKey) {
  const firstKey = getFirstKey(tokenAMint, tokenBMint)
  const secondKey = getSecondKey(tokenAMint, tokenBMint)

  // 0 is Curve Type for Constant Product
  const [pool] = PublicKey.findProgramAddressSync(
    [new anchor.BN(0).toBuffer(), firstKey.toBuffer(), secondKey.toBuffer()],
    METEORA_PROGRAM_ID
  )
  const [lpMint] = PublicKey.findProgramAddressSync(  
    [Buffer.from(LP_MINT_PREFIX), pool.toBuffer()],
    METEORA_PROGRAM_ID
  )
  const payerPoolLp = await getAssociatedTokenAccount(lpMint, payer);

  return {
    pool,
    lpMint,
    payerPoolLp
  }
}

export function getVaultPDA(tokenAMint: PublicKey, tokenBMint: PublicKey) { 
  const [
    { vaultPda: aVault, tokenVaultPda: aTokenVault, lpMintPda: aLpMintPda },
    { vaultPda: bVault, tokenVaultPda: bTokenVault, lpMintPda: bLpMintPda },
  ] = [getVaultPdas(tokenAMint, METEORA_VAULT_PROGRAM_ID), getVaultPdas(tokenBMint, METEORA_VAULT_PROGRAM_ID)];

  return {aVault, aTokenVault, aLpMintPda, bVault, bTokenVault, bLpMintPda}
}


export function getProtocolTokenFeePDA(tokenAMint: PublicKey, tokenBMint: PublicKey, poolKey: PublicKey) { 
  const [[protocolTokenAFee], [protocolTokenBFee]] = [
    PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_FEE_PREFIX), tokenAMint.toBuffer(), poolKey.toBuffer()],
      METEORA_PROGRAM_ID
    ),
    PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_FEE_PREFIX), tokenBMint.toBuffer(), poolKey.toBuffer()],
      METEORA_PROGRAM_ID
    ),
  ];

  return {protocolTokenAFee, protocolTokenBFee}
}

export function deriveMintMetadata(lpMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METAPLEX_PROGRAM.toBuffer(), lpMint.toBuffer()],
    METAPLEX_PROGRAM,
  );
}

export function getKeypairFromFile(filePath: string): Keypair {
  return Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync(filePath.toString(), "utf-8")
      )
    )
  );
}


function getFirstKey(key1: PublicKey, key2: PublicKey): PublicKey {
  // Convert public keys to base58 strings for comparison
  const key1Str = key1.toBase58();
  const key2Str = key2.toBase58();
  
  if (key1Str > key2Str) {
      return key1;
  }
  return key2;
}

export function getSecondKey(key1: PublicKey, key2: PublicKey): PublicKey {
  // Convert public keys to base58 strings for comparison
  const key1Str = key1.toBase58();
  const key2Str = key2.toBase58();
  
  if (key1Str > key2Str) {
      return key2;
  }
  return key1;
}


export const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112")


export const getAssociatedTokenAccount = (tokenMint: PublicKey, owner: PublicKey) => {
  return getAssociatedTokenAddressSync(tokenMint, owner, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
};



export const createProgram = (connection: Connection) => {
  const provider = new AnchorProvider(connection, {} as any, AnchorProvider.defaultOptions());
  
  const vaultProgram = new Program<VaultMeteora>(IDL as VaultMeteora, provider);

  return { vaultProgram };
};


export const getPumpSwapPDA = (
  index: number,
  creator: PublicKey,
  baseMint: PublicKey, 
  quoteMint: PublicKey,
) => {
  const [pool] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_PUMP_SWAP_PREFIX),
      new anchor.BN(index).toArrayLike(Buffer, 'le', 2),
      creator.toBuffer(),
      baseMint.toBuffer(),
      quoteMint.toBuffer()
    ],
    PUMP_SWAP_PROGRAM_ID
  );

  const poolBaseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    pool,
    true // allowOwnerOffCurve - set to true for PDAs
  );
  
  const poolQuoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    pool,
    true // allowOwnerOffCurve - set to true for PDAs
  );
  const [lpMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_lp_mint"), pool.toBuffer()],
    PUMP_SWAP_PROGRAM_ID
  );

  const userBaseTokenAccount = getAssociatedTokenAddressSync(
    baseMint,
    creator,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    // TOKEN_2022_PROGRAM_ID
  );

  const userQuoteTokenAccount = getAssociatedTokenAddressSync(
    quoteMint,
    creator,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
    //TOKEN_2022_PROGRAM_ID
  );

  const userPoolTokenAccount = getAssociatedTokenAddressSync(
    lpMint,
    creator,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
    // TOKEN_2022_PROGRAM_ID
  );
  const [globalConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_config")],
    PUMP_SWAP_PROGRAM_ID,
  );
  return {pool, poolBaseTokenAccount, poolQuoteTokenAccount, lpMint, userBaseTokenAccount, userQuoteTokenAccount, userPoolTokenAccount, globalConfig};
}


export async function accountExists(connection: Connection, account: PublicKey): Promise<boolean> {
  const accountInfo = await connection.getAccountInfo(account);
  return accountInfo !== null && !accountInfo.owner.equals(SystemProgram.programId);
}




