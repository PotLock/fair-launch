import { getBridgedAddressToken } from "@/lib/omni-bridge";
import { getSolPrice } from "@/lib/sol";
import { getPoolConfigByMint, getPoolStateByMint } from "@/lib/api";
import { Token } from "@/types/api";
import { PoolState, PoolConfig } from "@/types/pool";

export interface LaunchConditionsData {
    bridgeTokenAddresses: string[];
    solPrice: number | null;
    poolConfig: PoolConfig | null;
    poolState: PoolState | null;
    tokenPrice: number;
}

export async function fetchLaunchConditionsData(token: Token): Promise<LaunchConditionsData> {
    try {
        // Fetch all data in parallel
        const [bridgedAddresses, solPrice, poolConfig, poolState] = await Promise.all([
            getBridgedAddressToken(token?.mintAddress || ''),
            getSolPrice(),
            token?.mintAddress ? getPoolConfigByMint(token.mintAddress) : null,
            token?.mintAddress ? getPoolStateByMint(token.mintAddress) : null
        ]);

        // Calculate token price
        let tokenPrice = 0;
        if (poolState?.account && solPrice) {
            try {
                // Calculate token price from sqrtPrice
                // sqrtPrice is stored as a string, convert to number
                const sqrtPrice = parseFloat(poolState.account.sqrtPrice);
                // Price = (sqrtPrice / 2^64)^2
                const price = Math.pow(sqrtPrice / Math.pow(2, 64), 2);
                // Convert to USD if SOL price is available
                tokenPrice = price * solPrice;
            } catch (error) {
                console.error('Error calculating token price:', error);
                tokenPrice = 0;
            }
        }

        return {
            bridgeTokenAddresses: bridgedAddresses || [],
            solPrice,
            poolConfig,
            poolState,
            tokenPrice
        };
    } catch (error) {
        console.error('Error fetching launch conditions data:', error);
        return {
            bridgeTokenAddresses: [],
            solPrice: null,
            poolConfig: null,
            poolState: null,
            tokenPrice: 0
        };
    }
}
