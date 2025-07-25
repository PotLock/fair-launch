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
  // bump: u8 (1 byte)
  const bump = data.readUInt8(currentOffset);
  currentOffset += 1;

  return {
      creator: creator.toBase58(),
      totalSupply: Number(totalSupply), // Convert BigInt to Number (if safe, else keep as BigInt)
      reserveBalance: Number(reserveBalance),
      reserveToken: Number(reserveToken),
      token: token.toBase58(),
      bump,
  };
}


export function deserializeCurveConfiguration(data: Buffer) {
  let offset = 8; // Skip the 8-byte discriminator

  // Read global_admin: Pubkey (32 bytes)
  const globalAdmin = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // Read fee_admin: Pubkey (32 bytes)
  const feeAdmin = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // Read initial_quorum: u64 (8 bytes)
  const initialQuorum = data.readBigUInt64LE(offset);
  offset += 8;

  // Read use_dao: bool (1 byte)
  const useDao = data.readUInt8(offset) !== 0;
  offset += 1;

  // Read governance: Pubkey (32 bytes)
  const governance = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  offset += 32;

  // Read dao_quorum: u16 (2 bytes)
  const daoQuorum = data.readUInt16LE(offset);
  offset += 2;

  // Read locked_liquidity: bool (1 byte)
  const lockedLiquidity = data.readUInt8(offset) !== 0;
  offset += 1;

  // Read target_liquidity: u64 (8 bytes)
  const targetLiquidity = data.readBigUInt64LE(offset);
  offset += 8;

  // Read fee_percentage: u16 (2 bytes)
  const feePercentage = data.readUInt16LE(offset);
  offset += 2;

  // Read fees_enabled: bool (1 byte)
  const feesEnabled = data.readUInt8(offset) !== 0;
  offset += 1;

  // Read bonding_curve_type: u8 (1 byte), mapped to string
  const bondingCurveTypeRaw = data.readUInt8(offset);
  offset += 1;
  let bondingCurveType;
  if (bondingCurveTypeRaw === 0) {
      bondingCurveType = "Linear";
  } else if (bondingCurveTypeRaw === 1) {
      bondingCurveType = "Quadratic";
  } else {
      throw new Error("Invalid bonding curve type");
  }

  // Read max_token_supply: u64 (8 bytes)
  const maxTokenSupply = data.readBigUInt64LE(offset);
  offset += 8;

  // Read liquidity_lock_period: i64 (8 bytes)
  const liquidityLockPeriod = data.readBigInt64LE(offset);
  offset += 8;

  // Read liquidity_pool_percentage: u16 (2 bytes)
  const liquidityPoolPercentage = data.readUInt16LE(offset);
  offset += 2;

  // Read initial_price: u64 (8 bytes)
  const initialPrice = data.readBigUInt64LE(offset);
  offset += 8;

  // Read initial_supply: u64 (8 bytes)
  const initialSupply = data.readBigUInt64LE(offset);
  offset += 8;

  // Read fee_recipients: Vec<Recipient>
  const feeRecipientsLength = data.readUInt32LE(offset); // Length of the vector (4 bytes)
  offset += 4;

  const feeRecipients = [];
  for (let i = 0; i < feeRecipientsLength; i++) {
      // Read address: Pubkey (32 bytes)
      const address = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;

      // Read share: u16 (2 bytes)
      const share = data.readUInt16LE(offset);
      offset += 2;

      // Read amount: u64 (8 bytes)
      const amount = data.readBigUInt64LE(offset);
      offset += 8;

      // Read locking_period: i64 (8 bytes)
      const lockingPeriod = data.readBigInt64LE(offset);
      offset += 8;

      feeRecipients.push({
          address,
          share,
          amount: amount.toString(),
          lockingPeriod: lockingPeriod.toString()
      });
  }

  // Read total_fees_collected: u64 (8 bytes)
  const totalFeesCollected = data.readBigUInt64LE(offset);
  offset += 8;

  // Read reserve_ratio: u16 (2 bytes)
  const reserveRatio = data.readUInt16LE(offset);
  offset += 2;

  // Return the deserialized object
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


export const deserializeAllocationAndVesting = (data: Buffer) => {
  if (data.length < 8) {
      throw new Error(`Invalid account data length: expected at least 8 bytes for discriminator, got ${data.length}`);
  }

  // Expected minimum lengths
  const minLengthWithoutVesting = 8 + 32 + 1 + 8 + 8 + 1 + 1; // 51 bytes
  const minLengthWithVesting = minLengthWithoutVesting + 40; // 91 bytes

  let offset = 8; // Skip the 8-byte discriminator

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
  const hasVesting = data.readUInt8(offset) !== 0;
  offset += 1;

  // Validate data length
  if (!hasVesting && data.length < minLengthWithoutVesting) {
      throw new Error(`Invalid account data length: expected at least ${minLengthWithoutVesting} bytes, got ${data.length}`);
  }
  if (hasVesting && data.length < minLengthWithVesting) {
      throw new Error(`Invalid account data length: expected at least ${minLengthWithVesting} bytes, got ${data.length}`);
  }

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
          cliffPeriod: cliffPeriod.toString(),
          startTime: startTime.toString(),
          duration: duration.toString(),
          interval: interval.toString(),
          released: released.toString(),
          startTimeDate: new Date(Number(startTime) * 1000).toISOString(),
          cliffEndDate: new Date((Number(startTime) + Number(cliffPeriod)) * 1000).toISOString(),
          endDate: new Date((Number(startTime) + Number(duration)) * 1000).toISOString(),
      };
  }

  // bump: u8 (1 byte)
  const bump = data.readUInt8(offset);
  offset += 1;

  return {
      wallet: wallet.toBase58(),
      percentage,
      totalTokens: totalTokens.toString(),
      claimedTokens: claimedTokens.toString(),
      vesting,
      bump,
      unclaimedTokens: (BigInt(totalTokens) - BigInt(claimedTokens)).toString(),
      claimProgress: (Number(claimedTokens) / Number(totalTokens)) * 100, // Assumes safe range or adjust
      isFullyClaimed: BigInt(claimedTokens) >= BigInt(totalTokens),
  };
};

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

export function calculateInitialReserveAmount(
  initialPrice: bigint,
  initialSupply: bigint,
  reserveRatio: number,
  tokenDecimals: number
): bigint {
  // Validate inputs
  if (initialPrice <= 0n || initialSupply <= 0n) {
      throw new Error("Initial price and supply must be positive");
  }
  if (!Number.isInteger(reserveRatio) || reserveRatio <= 0 || reserveRatio > 65535) {
      throw new Error("Invalid reserve ratio");
  }
  if (!Number.isInteger(tokenDecimals) || tokenDecimals < 0 || tokenDecimals > 255) {
      throw new Error("Invalid token decimals");
  }

  // Calculate initial supply base (whole tokens)
  const divisor = 10n ** BigInt(tokenDecimals);
  const initialSupplyBase = initialSupply / divisor;

  // Calculate initial market cap
  const initialMarketCap = initialPrice * initialSupplyBase;

  // Calculate initial reserve
  const initialReserve = (initialMarketCap * BigInt(reserveRatio)) / 10000n;
  return initialReserve;
}