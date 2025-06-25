import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import fs from 'fs';
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { sendAndConfirmTransaction } from "@solana/web3.js";

const CURVE_CONFIGURATION_SEED = "curve_configuration"
const POOL_SEED_PREFIX = "bonding_curve"
const SOL_VAULT_PREFIX = "liquidity_sol_vault"
const FEE_POOL_SEED_PREFIX = "fee_pool"
const FEE_POOL_VAULT_PREFIX = "fee_pool_vault"

/// Allocation
const ALLOCATION_SEED_PREFIX = "allocation"


/// Fair Launch
const LAUNCHPAD_SEED_PREFIX = "launchpad"
const FAIR_LAUNCH_DATA_SEED_PREFIX = "fair_launch_data"
const CONTRIBUTION_VAULT_SEED_PREFIX = "fair_launch_vault"
const BUYER_SEED_PREFIX = "buyer"



export function deserializeBondingCurve(data) {

    const offset = 8; // Adjust to 0 if no discriminator is used

    let currentOffset = offset;

    // creator: Pubkey (32 bytes)
    const creator = new PublicKey(data.slice(currentOffset, currentOffset + 32));
    currentOffset += 32;

    // total_supply: u64 (8 bytes, little-endian)
    const totalSupply = data.readBigUInt64LE(currentOffset);
    currentOffset += 8;

    // reserve_balance: u64 (8 bytes, little-endian)
    const reserveBalance = data.readBigUInt64LE(currentOffset);
    currentOffset += 8;

    // reserve_token: u64 (8 bytes, little-endian)
    const reserveToken = data.readBigUInt64LE(currentOffset);
    currentOffset += 8;

    // token: Pubkey (32 bytes)
    const token = new PublicKey(data.slice(currentOffset, currentOffset + 32));
    currentOffset += 32;

    // reserve_ratio: u16 (2 bytes, little-endian)
    const reserveRatio = data.readUInt16LE(currentOffset);
    currentOffset += 2;

    // bump: u8 (1 byte)
    const bump = data.readUInt8(currentOffset);
    currentOffset += 1;

    return {
        creator: creator.toBase58(),
        totalSupply: Number(totalSupply), // Convert BigInt to Number (if safe, else keep as BigInt)
        reserveBalance: Number(reserveBalance),
        reserveToken: Number(reserveToken),
        token: token.toBase58(),
        reserveRatio,
        bump,
    };
}


export function deserializeCurveConfiguration(data) {
    // todo: check if the data length is correct
    // if (data.length !== 104) {
    //     throw new Error(`Invalid account data length: expected 104 bytes, got ${data.length}`);
    // }


    let offset = 8; // Skip the 8-byte discriminator

    const initialQuorum = data.readBigUInt64LE(offset);
    offset += 8;

    const useDao = data.readUInt8(offset) !== 0;
    offset += 1;

    const governance = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;

    const daoQuorum = data.readUInt16LE(offset);
    offset += 2;

    const lockedLiquidity = data.readUInt8(offset) !== 0;
    offset += 1;

    const targetLiquidity = data.readBigUInt64LE(offset);
    offset += 8;

    const feePercentage = data.readUInt16LE(offset);
    offset += 2;

    const feesEnabled = data.readUInt8(offset) !== 0;
    offset += 1;

    const bondingCurveType = data.readUInt8(offset);
    // offset += 1; // No need to increment further; we're at the end

    const maxTokenSupply = data.readBigUInt64LE(offset);
    offset += 8;

    const liquidityLockPeriod = data.readBigInt64LE(offset);
    offset += 8;

    const liquidityPoolPercentage = data.readUInt16LE(offset);
    offset += 2;

    return {
        initialQuorum: initialQuorum.toString(), // string (u64 as string to avoid precision loss)
        useDao,                       // boolean
        governance,                   // string (base58)
        daoQuorum,                    // number (u16)
        lockedLiquidity,              // boolean
        targetLiquidity: targetLiquidity.toString(), // string (u64 as string)
        feePercentage,                // number (u16)
        feesEnabled,                  // boolean
        bondingCurveType,             // number (u8, enum variant index)
        maxTokenSupply: maxTokenSupply.toString(), // string (u64 as string)
        liquidityLockPeriod: liquidityLockPeriod.toString(), // string (i64 as string)
        liquidityPoolPercentage,      // number (u16)
    };
}



export async function getPDAs(admin: PublicKey, user: PublicKey, mint: PublicKey, programId: PublicKey) {
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(CURVE_CONFIGURATION_SEED), admin.toBuffer()],
        programId,

    );

    const [bondingCurve] = PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
        programId
    );

    const [poolSolVault, poolSolVaultBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(SOL_VAULT_PREFIX), mint.toBuffer()],
        programId
    );

    const poolTokenAccount = await getAssociatedTokenAddress(
        mint, bondingCurve, true
    )
    const userTokenAccount = await getAssociatedTokenAddress(
        mint, user, true
    )

    const [feePool] = PublicKey.findProgramAddressSync(
        [Buffer.from(FEE_POOL_SEED_PREFIX), mint.toBuffer()],

        programId
    )

    const [feePoolVault, feePoolVaultBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(FEE_POOL_VAULT_PREFIX), mint.toBuffer()],
        programId
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

export function getAllocationPDAs(mint: PublicKey, wallet: PublicKey[], programId: PublicKey) {
    let allocations = []
    let allocationTokenAccounts = []
    let userTokenAccounts = []
    for (let i = 0; i < wallet.length; i++) {
        const [allocation] = PublicKey.findProgramAddressSync(
            [Buffer.from(ALLOCATION_SEED_PREFIX), wallet[i].toBuffer()],
            programId
        );
        allocations.push(allocation)

        const allocationTokenAccount = getAssociatedTokenAddressSync(
            mint, allocation, true
        )
        allocationTokenAccounts.push(allocationTokenAccount)

        const userTokenAccount = getAssociatedTokenAddressSync(
            mint, wallet[i], true
        )
        userTokenAccounts.push(userTokenAccount)
    }

    return {
        allocations,
        allocationTokenAccounts,
        userTokenAccounts,
    };
}

export function getFairLaunchPDAs(authority: PublicKey, mint: PublicKey, buyer: PublicKey, programId: PublicKey) {
    const [launchpad] = PublicKey.findProgramAddressSync(
      [Buffer.from(LAUNCHPAD_SEED_PREFIX), authority.toBuffer()],
      programId
    );
  
    const [fairLaunchData] = PublicKey.findProgramAddressSync(
      [Buffer.from(FAIR_LAUNCH_DATA_SEED_PREFIX), launchpad.toBuffer()],
      programId
    );
  
    const [fairLaunchVault] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_VAULT_SEED_PREFIX), launchpad.toBuffer()],
      programId
    );
  
    const [buyerAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from(BUYER_SEED_PREFIX), launchpad.toBuffer(), buyer.toBuffer()],
      programId
    );
  
    const launchpadTokenAccount = getAssociatedTokenAddressSync(
      mint, launchpad, true
    );
  
    const [contributionVault] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONTRIBUTION_VAULT_SEED_PREFIX), launchpad.toBuffer()],
      programId
    );
  
    return {
      launchpad,
      fairLaunchData,
      fairLaunchVault,
      launchpadTokenAccount,
      buyerAccount,
      contributionVault,
    };
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


export async function fetchBalancePool(connection: Connection, poolSolVault: PublicKey, poolTokenAccount: PublicKey) {
    // get native balance of poolSolVault
    const solBalance = await connection.getBalance(poolSolVault);

    // get token balance of poolTokenAccount
    const tokenBalance = await getAccount(connection, poolTokenAccount)

    return { solBalance, tokenBalance: tokenBalance.amount };
}


export const metadata = {
    "name": "Fair Launch Test Token",
    "symbol": "FLT",
    "description": "Fair Launch Token",
    "image": "https://magenta-impossible-turkey-605.mypinata.cloud/ipfs/bafybeigieesczeg7n36r3s4blkukdoaest4q3reg4azcr2syyycpwffbk4",
    "showName": true,
    "createdOn": "PortLock",
    "twitter": "",
    "telegram": "",
    "website": ""
}

/**
 * Calculate and log transaction size to help with debugging bulk transaction issues
 * @param transaction - The transaction to analyze
 * @param description - Description of the transaction for logging
 * @returns The size in bytes
 */
export function calculateTransactionSize(transaction: Transaction, description: string): number {
    const serializedSize = transaction.serialize().length;
    console.log(`${description} transaction size: ${serializedSize} bytes`);
    
    if (serializedSize > 1200) {
        console.warn(`⚠️  Transaction size (${serializedSize} bytes) is approaching the 1232 byte limit!`);
    }
    
    return serializedSize;
}

/**
 * Split a large array of instructions into batches that fit within transaction size limits
 * @param instructions - Array of instructions to batch
 * @param maxInstructionsPerBatch - Maximum instructions per batch (default: 10)
 * @returns Array of instruction batches
 */
export function batchInstructions(
    instructions: TransactionInstruction[], 
    maxInstructionsPerBatch: number = 10
): TransactionInstruction[][] {
    const batches: TransactionInstruction[][] = [];
    
    for (let i = 0; i < instructions.length; i += maxInstructionsPerBatch) {
        batches.push(instructions.slice(i, i + maxInstructionsPerBatch));
    }
    
    return batches;
}

/**
 * Execute multiple transactions with staggered timing to avoid network congestion
 * @param connection - Solana connection
 * @param transactions - Array of transactions to execute
 * @param signers - Array of signers for each transaction
 * @param interval - Time in milliseconds between transactions (default: 1000)
 * @returns Array of transaction signatures
 */
export async function executeStaggeredTransactions(
    connection: Connection,
    transactions: Transaction[],
    signers: Keypair[][],
    interval: number = 1000
): Promise<string[]> {
    const signatures: string[] = [];
    
    for (let i = 0; i < transactions.length; i++) {
        console.log(`Executing transaction ${i + 1}/${transactions.length}...`);
        
        const signature = await sendAndConfirmTransaction(
            connection,
            transactions[i],
            signers[i]
        );
        
        signatures.push(signature);
        console.log(`Transaction ${i + 1} completed: ${signature}`);
        
        // Wait between transactions (except for the last one)
        if (i < transactions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    return signatures;
}
