import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import * as anchor from "@project-serum/anchor";
import { SOL_NETWORK } from "../configs/env.config";
import { PublicKey } from "@solana/web3.js";
import { PREFIX_TOKEN } from "./comon";
import { getAssociatedTokenAddress } from "@solana/spl-token";

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
  const [curveConfig] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(PREFIX_TOKEN.CURVE_CONFIGURATION_SEED),
      mint.toBuffer(),
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