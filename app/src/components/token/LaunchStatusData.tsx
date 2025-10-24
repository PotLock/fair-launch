import { 
  getPoolConfigByMint, 
  getPoolCurveProgressByMint, 
  getPoolStateByMint,
  getTokenHolders 
} from "@/lib/api";
import { 
  calculateTokenPrice, 
  formatTokenPrice, 
  calculateMarketCap, 
  formatMarketCap 
} from "@/utils";
import { getSolPrice } from "@/lib/sol";
import LaunchStatus from "./LaunchStatus";

interface LaunchStatusDataProps {
  mint: string;
  totalSupply: string;
  decimals: number;
}

export type LaunchPhase = "pre-launch" | "live" | "ready-to-migrate" | "migrated";

export interface LaunchStatusData {
  phase: LaunchPhase;
  progress: number;
  currentPrice: number;
  marketCap: number;
  holders: number;
  poolConfig: any;
  poolState: any;
  curveProgress: number;
  baseSold: number;
  migrationThreshold: number;
  isMigrated: boolean;
}

async function determineLaunchPhase(
  baseSold: number, 
  curveProgress: number, 
  migratedPoolFeeBps: number
): Promise<LaunchPhase> {
  if (baseSold === 0) return "pre-launch";
  if (curveProgress < 1) return "live";
  if (curveProgress >= 1 && migratedPoolFeeBps === 0) return "ready-to-migrate";
  if (migratedPoolFeeBps > 0) return "migrated";
  return "pre-launch";
}

export default async function LaunchStatusData({ 
  mint, 
  totalSupply, 
  decimals 
}: LaunchStatusDataProps) {
  try {
    // Fetch all data in parallel for better performance
    const [poolConfig, curveProgressRaw, poolState, holders, solPrice] = await Promise.all([
      getPoolConfigByMint(mint),
      getPoolCurveProgressByMint(mint),
      getPoolStateByMint(mint),
      getTokenHolders(mint),
      getSolPrice()
    ]);
    
    const hexToNumber = (hex: string) => (!hex || hex === "00" ? 0 : parseInt(hex, 16));
    
    const migrationQuoteThreshold = hexToNumber(poolConfig?.migrationQuoteThreshold);
    const migrationBaseThreshold = hexToNumber(poolConfig?.migrationBaseThreshold);
    const isMigrated = poolConfig?.migratedPoolFeeBps > 0;
    
    const curveProgress = migrationQuoteThreshold > 0
      ? Number(poolState?.account?.quoteReserve || 0) / migrationQuoteThreshold
      : curveProgressRaw || 0;
    
    const baseSold = curveProgress * migrationBaseThreshold / Math.pow(10, decimals);

    const sqrtPrice = poolState?.account?.sqrtPrice;
    const tokenPrice = sqrtPrice ? calculateTokenPrice(sqrtPrice) * (solPrice || 0) : 0;
    const marketCap = calculateMarketCap(baseSold, totalSupply.toString(), decimals);
    
    const phase = await determineLaunchPhase(
      baseSold,
      curveProgress,
      poolConfig?.migratedPoolFeeBps || 0
    );
    
    const launchData: LaunchStatusData = {
      phase,
      progress: curveProgress,
      currentPrice: tokenPrice,
      marketCap,
      holders: holders.length,
      poolConfig,
      poolState,
      curveProgress,
      baseSold,
      migrationThreshold: migrationQuoteThreshold,
      isMigrated
    };

    return <LaunchStatus data={launchData} />;
  } catch (error) {
    console.error('Error fetching launch status data:', error);
    
    // Return fallback data on error
    const fallbackData: LaunchStatusData = {
      phase: "pre-launch",
      progress: 0,
      currentPrice: 0,
      marketCap: 0,
      holders: 0,
      poolConfig: null,
      poolState: null,
      curveProgress: 0,
      baseSold: 0,
      migrationThreshold: 0,
      isMigrated: false
    };

    return <LaunchStatus data={fallbackData} />;
  }
}
