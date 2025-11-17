import { getBridgedAddressToken } from "@/lib/omni-bridge";
import { getSolPrice } from "@/lib/sol";
import { getPoolConfigByMint, getPoolStateByMint } from "@/lib/api";
import { Token } from "@/types/api";
import { PoolState, PoolConfig } from "@/types/pool";
import { hexToNumber } from "@/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface LaunchConditionsData {
    bridgeTokenAddresses: string[];
    solPrice: number | null;
    poolConfig: PoolConfig | null;
    poolState: PoolState | null;
    tokenPrice: number;
}

export async function fetchLaunchConditionsData(token: Token): Promise<LaunchConditionsData> {
    try {
        const [bridgedAddresses, solPrice, poolConfig, poolState] = await Promise.all([
            getBridgedAddressToken(token?.mintAddress || ''),
            getSolPrice(),
            token?.mintAddress ? getPoolConfigByMint(token.mintAddress) : null,
            token?.mintAddress ? getPoolStateByMint(token.mintAddress) : null
        ]);

        let tokenPrice = 0;
        if (poolState?.account && solPrice && token?.decimals) {
            try {
                const quote = hexToNumber(poolState.account.quoteReserve) / LAMPORTS_PER_SOL;
                const base = hexToNumber(poolState.account.baseReserve) / Math.pow(10, token.decimals);
                const priceInSol = base > 0 ? quote / base : 0;
                tokenPrice = priceInSol * solPrice;
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
