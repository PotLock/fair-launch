import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import * as anchor from "@project-serum/anchor";
import { SOL_NETWORK } from "../configs/env.config";
import { PublicKey } from "@solana/web3.js";
import { PREFIX_TOKEN } from "./common";
import { getAssociatedTokenAddress, getAssociatedTokenAddressSync } from "@solana/spl-token";

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

export async function getPDAs(user: PublicKey, mint: PublicKey, program: any) {
  // Validate parameters
  if (!user) {
    throw new Error("User public key is required");
  }
  if (!mint) {
    throw new Error("Mint public key is required");
  }
  if (!program) {
    throw new Error("Program is required");
  }
  if (!program.programId) {
    throw new Error("Program ID is required");
  }

  const [curveConfig] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(PREFIX_TOKEN.CURVE_CONFIGURATION_SEED),
      user.toBuffer(),
    ],
    program.programId
  );

  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.POOL_SEED_PREFIX), mint.toBuffer()],
    program.programId
  );

  const [poolSolVault, poolSolVaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.SOL_VAULT_PREFIX), mint.toBuffer()],
    program.programId
  );

  const poolTokenAccount = await getAssociatedTokenAddress(
    mint,
    bondingCurve,
    true
  );
  const userTokenAccount = await getAssociatedTokenAddress(mint, user, true);

  const [feePool] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.FEE_POOL_SEED_PREFIX), mint.toBuffer()],

    program.programId
  );

  const [feePoolVault, feePoolVaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(PREFIX_TOKEN.FEE_POOL_VAULT_PREFIX), mint.toBuffer()],
    program.programId
  );

  return {
    userTokenAccount,
    curveConfig,
    bondingCurve,
    poolSolVault,
    poolSolVaultBump,
    poolTokenAccount,
    feePool,
    feePoolVault,
    feePoolVaultBump,
  };
}

export function getAllocationPDAs(mint: PublicKey, wallet: PublicKey[], programId: PublicKey) {
  // Validate parameters
  if (!mint) {
    throw new Error("Mint public key is required");
  }
  if (!wallet || wallet.length === 0) {
    throw new Error("Wallet addresses are required");
  }
  if (!programId) {
    throw new Error("Program ID is required");
  }

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
  // Validate parameters
  if (!authority) {
    throw new Error("Authority public key is required");
  }
  if (!mint) {
    throw new Error("Mint public key is required");
  }
  if (!buyer) {
    throw new Error("Buyer public key is required");
  }
  if (!programId) {
    throw new Error("Program ID is required");
  }

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
