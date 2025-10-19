import { getRpcSOLEndpoint } from "@/lib/sol";
import { DbcConfig } from "@/types/dbc";
import { TokenMetadata } from "@/types/token";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export function getDBCConfig(payer: PublicKey, tokenName: string, tokenSymbol: string, metadata: TokenMetadata): DbcConfig {
    return {
        rpcUrl: getRpcSOLEndpoint(), // Required: RPC URL for Solana network connection
        computeUnitPriceMicroLamports: 100000, // Required: Compute unit price in micro lamports (0.001 SOL per compute unit)
        quoteMint: NATIVE_MINT.toString(), // Required: Quote token mint address (SOL, USDC, or any other token)
        dbcConfig: {
            // Bonding curve configuration mode
            buildCurveMode: 0, // 0 - buildCurve | 1 - buildCurveWithMarketCap | 2 - buildCurveWithTwoSegments | 3 - buildCurveWithLiquidityWeights
            
            // Parameters for buildCurveMode: 0 (buildCurve)
            percentageSupplyOnMigration: 20, // Percentage of total token supply to be migrated to DEX
            migrationQuoteThreshold: 10, // Migration quote threshold needed to migrate the DBC token pool
            
            // Token supply and migration settings
            totalTokenSupply: 1000000000, // Total token supply (not in lamports) - 1 billion tokens
            migrationOption: 1, // 0 - Migrate to DAMM v1 | 1 - Migrate to DAMM v2
            
            // Token decimal configuration
            tokenBaseDecimal: 6, // Token base decimal places
            tokenQuoteDecimal: 9, // Token quote decimal places (should match quote token decimals)
            
            // Vesting configuration (currently disabled)
            lockedVestingParam: {
                totalLockedVestingAmount: 0, // Total locked vesting amount (not in lamports)
                numberOfVestingPeriod: 0, // Number of vesting periods
                cliffUnlockAmount: 0, // Cliff unlock amount (not in lamports)
                totalVestingDuration: 0, // Total vesting duration (in seconds)
                cliffDurationFromMigrationTime: 0 // Cliff duration from migration time (in seconds)
            },
            
            // Fee configuration
            baseFeeParams: {
                baseFeeMode: 0, // 0 - Fee Scheduler: Linear | 1 - Fee Scheduler: Exponential | 2 - Rate Limiter
                feeSchedulerParam: {
                    startingFeeBps: 100, // Starting fee in basis points (max 99% fee = 9900 bps)
                    endingFeeBps: 100, // Ending fee in basis points (minimum 0.01% fee = 1 bps)
                    numberOfPeriod: 0, // Number of fee periods
                    totalDuration: 0 // Total duration for fee changes (in seconds if activationType is 1)
                }
            },
            
            // Dynamic fee settings
            dynamicFeeEnabled: true, // If true, dynamic fee will add 20% of minimum base fee to the total fee
            activationType: 1, // 0 - Slot based activation | 1 - Timestamp based activation
            collectFeeMode: 0, // 0 - Collect fees in Quote Token | 1 - Collect fees in Output Token
            
            // Migration fee options
            migrationFeeOption: 3, // 0 - LP Fee 0.25% | 1 - LP Fee 0.3% | 2 - LP Fee 1% | 3 - LP Fee 2% | 4 - LP Fee 4% | 5 - LP Fee 6%
            
            // Token type
            tokenType: 0, // 0 - SPL Token | 1 - Token 2022
            
            // Liquidity provider (LP) distribution percentages
            partnerLpPercentage: 50, // Partner claimable LP percentage (withdrawable LP once pool migrates)
            creatorLpPercentage: 50, // Creator claimable LP percentage (withdrawable LP once pool migrates)
            partnerLockedLpPercentage: 0, // Partner locked LP percentage (permanently locked LP once pool migrates)
            creatorLockedLpPercentage: 0, // Creator locked LP percentage (permanently locked LP once pool migrates)
            
            // Trading fee sharing
            creatorTradingFeePercentage: 50, // Bonding curve trading fee sharing (0% to 100%) - 0% means all trading fees go to the partner
            
            // Leftover tokens
            leftover: 0, // Leftover tokens in the bonding curve (claimable once pool migrates)
            
            // Token authority settings
            tokenUpdateAuthority: 1, // 0 - CreatorUpdateAuthority | 1 - Immutable | 2 - PartnerUpdateAuthority | 3 - CreatorUpdateAndMintAuthority | 4 - PartnerUpdateAndMintAuthority
            
            // Migration fee configuration
            migrationFee: {
                feePercentage: 0, // Percentage of fee taken from migration quote threshold once pool migrates (0% to 50%)
                creatorFeePercentage: 0 // Percentage of the migrationFee.feePercentage claimable by creator (0% to 100%)
            },
            
            // Addresses for leftover tokens and fee claiming
            leftoverReceiver: payer.toString(), // Address to receive leftover tokens
            feeClaimer: payer.toString() // Address to claim trading fees
        },
        dbcPool: {
            name: tokenName, // Token name
            symbol: tokenSymbol, // Token symbol
            metadata: metadata // Token metadata (image, description, website, social links)
        }
    };
}