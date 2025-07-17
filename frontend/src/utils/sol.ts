import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SOL_NETWORK } from "../configs/env.config";
import { PublicKey } from "@solana/web3.js";
import { PREFIX_TOKEN } from "./common";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import idlBondingCurve from "../contracts/IDLs/bonding_curve.json";

export const ALLOCATION_SEED_PREFIX = "allocation";

/// Fair Launch
export const LAUNCHPAD_SEED_PREFIX = "launchpad"
export const FAIR_LAUNCH_DATA_SEED_PREFIX = "fair_launch_data"
export const CONTRIBUTION_VAULT_SEED_PREFIX = "fair_launch_vault"
export const BUYER_SEED_PREFIX = "buyer"

export const getProvider = () => {
  if (typeof window !== "undefined" && "phantom" in window) {
    const { phantom } = window as any;
    const provider = phantom.solana;

    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
};

export const solNetwork = () => {
  switch (SOL_NETWORK) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

export const formatNumberToK = (x: number) => {
  switch (true) {
    case x >= 1000:
      const kValue = x / 1000;
      return `${kValue}K`;
    case x >= 1000000:
      const mValue = x / 1000;
      return `${mValue}M`;
    case x >= 1000000000:
      const bValue = x / 1000;
      return `${bValue}B`;
    default:
      return x;
  }
};

export async function getBondingCurveConfig(admin: PublicKey, configIndex: number) {
  const configIndexBuffer = new anchor.BN(configIndex).toArrayLike(Buffer, "le", 8);
  const [curveConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.CURVE_CONFIGURATION_SEED), admin.toBuffer(), configIndexBuffer],
    new PublicKey(idlBondingCurve.address)
  );
  return curveConfig;
}

export function getPDAs(user: PublicKey, mint: PublicKey) {

  const [curveConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.CURVE_CONFIGURATION_SEED), mint.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );

  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.POOL_SEED_PREFIX), mint.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );

  const [poolSolVault, poolSolVaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.SOL_VAULT_PREFIX), mint.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );

  const poolTokenAccount = getAssociatedTokenAddressSync(
    mint, bondingCurve, true
  )

  const userTokenAccount = getAssociatedTokenAddressSync(
    mint, user, true
  )

  return {
    curveConfig,
    userTokenAccount,
    bondingCurve,
    poolSolVault,
    poolSolVaultBump,
    poolTokenAccount,
  };
}

export function getAllocationPDAs(mint: PublicKey, wallet: PublicKey[]) {
  let allocations = []
  let allocationTokenAccounts = []
  let userTokenAccounts = []
  for (let i = 0; i < wallet.length; i++) {
      const [allocation] = PublicKey.findProgramAddressSync(
        [Buffer.from(ALLOCATION_SEED_PREFIX), wallet[i].toBuffer(), mint.toBuffer()],
        new PublicKey(idlBondingCurve.address)
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


export function getFairLaunchPDAs(mint: PublicKey) {
  
  const [fairLaunchData] = PublicKey.findProgramAddressSync(
    [Buffer.from(FAIR_LAUNCH_DATA_SEED_PREFIX), mint.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );

  const [fairLaunchVault] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONTRIBUTION_VAULT_SEED_PREFIX), fairLaunchData.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );


  const launchpadTokenAccount = getAssociatedTokenAddressSync(
    mint, fairLaunchData, true
  );

  const [contributionVault] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONTRIBUTION_VAULT_SEED_PREFIX), fairLaunchData.toBuffer()],
    new PublicKey(idlBondingCurve.address)
  );

  return {
    fairLaunchData,
    fairLaunchVault,
    launchpadTokenAccount,
    contributionVault,
  };
}


export function deserializeBondingCurve(data: Buffer) {

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

export const deserializeAllocationAndVesting = (data: Buffer) => {
  if (data.length < 8) {
      throw new Error(`Invalid account data length: expected at least 8 bytes for discriminator, got ${data.length}`);
  }

  let offset = 8; // Skip the 8-byte discriminator

  // category: String
  // String is serialized as: 4 bytes (length) + string bytes
  const categoryLength = data.readUInt32LE(offset);
  offset += 4;
  const category = data.slice(offset, offset + categoryLength).toString('utf8');
  offset += categoryLength;

  // wallet: Pubkey (32 bytes)
  const wallet = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // percentage: u8 (1 byte)
  const percentage = data.readUInt8(offset);
  offset += 1;

  // total_tokens: u64 (8 bytes, little-endian)
  const totalTokens = data.readBigUInt64LE(offset);
  offset += 8;

  // claimed_tokens: u64 (8 bytes, little-endian)
  const claimedTokens = data.readBigUInt64LE(offset);
  offset += 8;

  // vesting: Option<Vesting>
  // Option is serialized as: 1 byte (0 = None, 1 = Some) + data if Some
  const hasVesting = data.readUInt8(offset) !== 0;
  offset += 1;

  let vesting = null;
  if (hasVesting) {
      // cliff_period: i64 (8 bytes, little-endian, signed)
      const cliffPeriod = data.readBigInt64LE(offset);
      offset += 8;

      // start_time: i64 (8 bytes, little-endian, signed)
      const startTime = data.readBigInt64LE(offset);
      offset += 8;

      // duration: i64 (8 bytes, little-endian, signed)
      const duration = data.readBigInt64LE(offset);
      offset += 8;

      // interval: i64 (8 bytes, little-endian, signed)
      const interval = data.readBigInt64LE(offset);
      offset += 8;

      // released: u64 (8 bytes, little-endian, unsigned)
      const released = data.readBigUInt64LE(offset);
      offset += 8;

      vesting = {
          cliffPeriod: cliffPeriod.toString(), // Convert to string to avoid precision loss
          startTime: startTime.toString(),
          duration: duration.toString(),
          interval: interval.toString(),
          released: Number(released), // Convert to number if safe, else keep as string
          // Add human-readable timestamps
          startTimeDate: new Date(Number(startTime) * 1000).toISOString(),
          cliffEndDate: new Date((Number(startTime) + Number(cliffPeriod)) * 1000).toISOString(),
          endDate: new Date((Number(startTime) + Number(duration)) * 1000).toISOString(),
      };
  }

  // bump: u8 (1 byte)
  const bump = data.readUInt8(offset);
  offset += 1;

  return {
      category,
      wallet: wallet.toBase58(),
      percentage,
      totalTokens: Number(totalTokens), // Convert to number if safe
      claimedTokens: Number(claimedTokens),
      vesting,
      bump,
      // Add calculated fields for convenience
      unclaimedTokens: Number(totalTokens) - Number(claimedTokens),
      claimProgress: Number(claimedTokens) / Number(totalTokens) * 100, // Percentage claimed
      isFullyClaimed: Number(claimedTokens) >= Number(totalTokens),
  };
}

export function deserializeCurveConfiguration(data: Buffer) {
  // The data length will be variable due to the Vec<Recipient> field
  let offset = 8; // Skip the 8-byte discriminator

  // global_admin: Pubkey (32 bytes)
  const globalAdmin = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // fee_admin: Pubkey (32 bytes)
  const feeAdmin = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // initial_quorum: u64
  const initialQuorum = data.readBigUInt64LE(offset);
  offset += 8;

  // use_dao: bool
  const useDao = data.readUInt8(offset) !== 0;
  offset += 1;

  // governance: Pubkey (32 bytes)
  const governance = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // dao_quorum: u16
  const daoQuorum = data.readUInt16LE(offset);
  offset += 2;

  // locked_liquidity: bool
  const lockedLiquidity = data.readUInt8(offset) !== 0;
  offset += 1;

  // target_liquidity: u64
  const targetLiquidity = data.readBigUInt64LE(offset);
  offset += 8;

  // fee_percentage: u16
  const feePercentage = data.readUInt16LE(offset);
  offset += 2;

  // fees_enabled: bool
  const feesEnabled = data.readUInt8(offset) !== 0;
  offset += 1;

  // bonding_curve_type: BondingCurveType (u8 enum)
  const bondingCurveType = data.readUInt8(offset);
  offset += 1;

  // max_token_supply: u64
  const maxTokenSupply = data.readBigUInt64LE(offset);
  offset += 8;

  // liquidity_lock_period: i64
  const liquidityLockPeriod = data.readBigInt64LE(offset);
  offset += 8;

  // liquidity_pool_percentage: u16
  const liquidityPoolPercentage = data.readUInt16LE(offset);
  offset += 2;

  // initial_price: u64
  const initialPrice = data.readBigUInt64LE(offset);
  offset += 8;

  // initial_supply: u64
  const initialSupply = data.readBigUInt64LE(offset);
  offset += 8;

  // fee_recipients: Vec<Recipient>
  // Vec is serialized as: 4 bytes (length) + data
  const feeRecipientsLength = data.readUInt32LE(offset);
  offset += 4;
  
  const feeRecipients = [];
  for (let i = 0; i < feeRecipientsLength; i++) {
      // Each Recipient contains: Pubkey (32 bytes) + percentage: u16 (2 bytes)
      const recipientPubkey = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;
      const percentage = data.readUInt16LE(offset);
      offset += 2;
      
      feeRecipients.push({
          pubkey: recipientPubkey,
          percentage: percentage
      });
  }

  // total_fees_collected: u64
  const totalFeesCollected = data.readBigUInt64LE(offset);
  offset += 8;

  // reserve_ratio: u16
  const reserveRatio = data.readUInt16LE(offset);
  offset += 2;

  return {
      globalAdmin,
      feeAdmin,
      initialQuorum: initialQuorum.toString(),
      useDao,
      governance,
      daoQuorum,
      lockedLiquidity,
      targetLiquidity: targetLiquidity.toString(),
      feePercentage,
      feesEnabled,
      bondingCurveType,
      maxTokenSupply: maxTokenSupply.toString(),
      liquidityLockPeriod: liquidityLockPeriod.toString(),
      liquidityPoolPercentage,
      initialPrice: initialPrice.toString(),
      initialSupply: initialSupply.toString(),
      feeRecipients,
      totalFeesCollected: totalFeesCollected.toString(),
      reserveRatio,
  };
}

export function calculateInitialReserveAmount(
  initialPrice: number,
  initialSupply: number,
  reserveRatio: number,
  tokenDecimals: number
): number {
  // Validate inputs
  if (reserveRatio <= 0) {
    throw new Error("InvalidAmount: reserve_ratio must be greater than 0");
  }
  if (initialSupply <= 0) {
    throw new Error("InvalidAmount: initial_supply must be greater than 0");
  }
  if (initialPrice <= 0) {
    throw new Error("InvalidAmount: initial_price must be greater than 0");
  }

  // Convert initial supply to base units (e.g., 1000_000_000 -> 1000)
  const initialSupplyBase = Math.floor(initialSupply / Math.pow(10, tokenDecimals));
  if (isNaN(initialSupplyBase) || !isFinite(initialSupplyBase)) {
    throw new Error("OverFlowUnderFlowOccured: Division overflow");
  }

  // Calculate initial market cap
  // Formula: initial_market_cap = initial_price * initial_supply_base
  const initialMarketCap = initialPrice * initialSupplyBase;
  if (isNaN(initialMarketCap) || !isFinite(initialMarketCap)) {
    throw new Error("OverFlowUnderFlowOccured: Multiplication overflow");
  }

  // Calculate initial reserve amount
  // Formula: initial_reserve = (initial_market_cap * reserve_ratio) / 10000
  const initialReserve = (initialMarketCap * reserveRatio) / 10000;
  if (isNaN(initialReserve) || !isFinite(initialReserve)) {
    throw new Error("OverFlowUnderFlowOccured: Division overflow");
  }

  // Validate the result is within safe bounds (using Number.MAX_SAFE_INTEGER as approximation for u64)
  if (initialReserve > Number.MAX_SAFE_INTEGER) {
    throw new Error("OverFlowUnderFlowOccured: Result exceeds safe integer bounds");
  }

  return Math.floor(initialReserve);
}

/**
 * Calculates the cost to buy a certain amount of tokens based on a linear bonding curve.
 *
 * @param amount The amount of tokens to buy.
 * @param reserveRatio The reserve ratio for the curve calculation.
 * @param totalSupply The current total supply of tokens.
 * @returns The cost to buy the specified amount.
 */
export function linearBuyCost(amount: bigint, reserveRatio: number, totalSupply: bigint): bigint {
  const newSupply = totalSupply + amount;

  const newSupplySquared = newSupply * newSupply;
  const totalSupplySquared = totalSupply * totalSupply;

  const numerator = (newSupplySquared - totalSupplySquared) / 2n;

  const denominator = BigInt(reserveRatio) * 10000n;

  const cost = numerator / denominator;

  return cost;
}

/**
 * Calculates the reward for selling a certain amount of tokens based on a linear bonding curve.
 *
 * @param amount The amount of tokens to sell.
 * @param reserveRatio The reserve ratio for the curve calculation.
 * @param totalSupply The current total supply of tokens.
 * @returns The reward for selling the specified amount.
 */
export function linearSellCost(amount: bigint, reserveRatio: number, totalSupply: bigint): bigint {
  console.log("amount", amount)
  console.log("reserveRatio", reserveRatio)
  console.log("totalSupply", totalSupply)
  const newSupply = totalSupply - amount;

  console.log("newSupply", newSupply)

  const totalSupplySquared = totalSupply * totalSupply;
  const newSupplySquared = newSupply * newSupply;

  const numerator = (totalSupplySquared - newSupplySquared) / 2n;

  const denominator = BigInt(reserveRatio) * 10000n;

  const reward = numerator / denominator;

  return reward;
}