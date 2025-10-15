import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SOL_NETWORK } from "@/configs/env.config";

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

export const getSOLNetwork = () => {
  switch (SOL_NETWORK) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

// Constants for scaling
const LAMPORTS_PER_SOL = 1e9;
const TOKEN_DECIMALS = 1e6;


export function getCurrentPriceSOL(virtualSolReserves: bigint, virtualTokenReserves: bigint): number {
  const solReserve = Number(virtualSolReserves) / LAMPORTS_PER_SOL;
  const tokenReserve = Number(virtualTokenReserves) / TOKEN_DECIMALS;
  return solReserve / tokenReserve;
}