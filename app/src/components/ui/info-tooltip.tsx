"use client"

import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
}

export function InfoTooltip({ content, title, children }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border border-gray-200 text-[11px]">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-[11px]">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const DBC_TOOLTIPS = {
  overview: {
    title: "Dynamic Bonding Curve (DBC)",
    description: "DBC is Meteora's virtual liquidity pool system that allows you to launch tokens with an automated bonding curve. Your token starts in a virtual pool and automatically migrates to a full DLMM pool once the fundraising target is reached (minimum 750 USD). Migration happens in 4 phases: PreBondingCurve (0) → PostBondingCurve (1) → LockedVesting (2) → CreatedPool (3)."
  },
  migrationPhases: {
    title: "Migration Phases",
    description: "Phase 0: PreBondingCurve - Initial setup | Phase 1: PostBondingCurve - Active trading with bonding curve | Phase 2: LockedVesting - Vesting period for locked tokens | Phase 3: CreatedPool - Full DEX pool created. Migration triggers when quoteReserve >= migrationQuoteThreshold."
  },
  totalTokenSupply: {
    title: "Total Token Supply",
    description: "Total number of tokens that will exist. Part of this supply goes into the bonding curve reserve for price discovery, while the rest enters circulation. The percentageSupplyOnMigration determines how much gets migrated to the LP pool."
  },
  tokenQuoteAddress: {
    title: "Token Quote Address",
    description: "The quote token (trading pair) for your bonding curve. Common options: SOL (native), USDC, or USDT. This is the token users will trade against your token. SOL is recommended for maximum liquidity."
  },
  tokenBaseDecimal: {
    title: "Token Base Decimal",
    description: "Number of decimal places for your token (base mint). Standard is 6-9 decimals. Higher decimals (6-9) allow for more precise pricing and smaller unit trading. Must be between 0-99."
  },
  tokenQuoteDecimal: {
    title: "Token Quote Decimal",
    description: "Number of decimal places for the quote token. SOL uses 9 decimals, USDC uses 6. This should match the decimals of your chosen quote token for proper price calculations."
  },
  buildCurveMode: {
    title: "Build Curve Mode",
    modes: {
      "0": {
        label: "Build Curve",
        description: "Useful when you want to create a curve configuration with specific migrationQuoteThreshold and percentageSupplyOnMigration. The percentage specifies the ratio of total token supply that will be migrated to the LP pool after graduation."
      },
      "1": {
        label: "Market Cap Based",
        description: "Useful when you want to create a curve configuration with specific initial token price and migration price. Use this when you have defined initial and migration market cap targets for your token."
      },
      "2": {
        label: "Two Segments",
        description: "Creates a dual constant product curve structure. Requires initialMarketCap, migrationMarketCap and percentageSupplyOnMigration to define the two-segment bonding curve."
      },
      "3": {
        label: "Liquidity Weights",
        description: "Useful when you want to create a curve configuration with unique price action (flat, exponential, etc.). Liquidity weights work as exponents controlling the thickness of segments, allowing customization of price dynamics across curve segments."
      }
    }
  },
  percentageSupplyOnMigration: "Percentage of total token supply that will be migrated to the liquidity pool after graduation. Value from 0-100%.",
  migrationQuoteThreshold: "Minimum amount of quote tokens required to qualify for migration. Set minimum 750 USD for automatic migration via migration keepers.",
  initialMarketCap: "Market cap of DBC token pool when pool is created, specified in quoteMint (not lamports).",
  migrationMarketCap: "Market cap of DBC token pool when pool graduates, specified in quoteMint (not lamports).",
  liquidityWeights: "Array of 16 liquidity weights for each liquidity segment in the curve. Weights work as exponents to control price action.",
  migrationOption: {
    title: "Migration Option",
    options: {
      "0": "DAMM v1 - Pool will be migrated to DAMM v1 pool. Post-graduation pools use Output Token collection mode.",
      "1": "DAMM v2 - Pool will be migrated to DAMM v2 pool. Uses Quote Token collection; dynamic fees add 20% to base fees."
    }
  },
  migrationFeeOption: {
    title: "Migration Fee Option",
    description: "Predefined LP fee tiers from 0.25% to 6%. Option 6 (Customizable) is only available if migrationOption is set to DAMM v2."
  },
  dynamicFeeEnabled: "If true, dynamic fee will add 20% of minimum base fee to the total fee.",
  activationType: {
    title: "Activation Type",
    options: {
      "0": "Slot - Pool time is measured in Slots (1 slot = 400ms)",
      "1": "Timestamp - Pool time is measured in Timestamps (seconds)"
    }
  },
  collectFeeMode: {
    title: "Collect Fee Mode",
    options: {
      "0": "Quote Token - Pre-graduation fees are collected as Quote Token",
      "1": "Output Token - Pre-graduation fees are collected as Output Token"
    }
  },
  tokenType: {
    title: "Token Type",
    options: {
      "0": "SPL - Standard SPL token",
      "1": "Token 2022 - Token following the new Token-2022 standard"
    }
  },
  baseFeeMode: {
    title: "Base Fee Mode",
    modes: {
      "0": "Linear Fee Scheduler - Fees decrease linearly over time",
      "1": "Exponential Fee Scheduler - Fees decrease exponentially",
      "2": "Rate Limiter - Limits transaction rate with dynamically increasing fees"
    }
  },
  feeScheduler: {
    startingFeeBps: "Starting fee in basis points (100 bps = 1%). Maximum 99% (9900 bps).",
    endingFeeBps: "Ending fee in basis points. Minimum 0.01% (1 bps).",
    numberOfPeriod: "Number of periods for fees to decrease from starting to ending.",
    totalDuration: "Total duration (if activationType=0: duration/0.4, if =1: duration in seconds)"
  },
  rateLimiter: {
    baseFeeBps: "Base fee in basis points. Maximum 99% (9900 bps).",
    feeIncrementBps: "Fee increment when exceeding reference amount. Maximum = 9900 bps - baseFeeBps.",
    referenceAmount: "Reference amount (not lamports) to trigger fee increment.",
    maxLimiterDuration: "Maximum limiter duration (if activationType=0: duration/0.4, if =1: duration)"
  },
  vesting: {
    totalLockedVestingAmount: "Total amount of baseMint tokens locked in vesting. Only starts after pool has migrated.",
    numberOfVestingPeriod: "Total number of vesting periods.",
    cliffUnlockAmount: "Amount of tokens unlocked immediately after cliff period (in lamports).",
    totalVestingDuration: "Total vesting duration (in seconds).",
    cliffDurationFromMigrationTime: "Cliff time from migration (in seconds). No tokens are unlocked during this period."
  },
  lpDistribution: {
    partnerLpPercentage: "Percentage of unlockable LP tokens for partner. Can be withdrawn after pool migrates.",
    creatorLpPercentage: "Percentage of unlockable LP tokens for creator. Can be withdrawn after pool migrates.",
    partnerLockedLpPercentage: "Percentage of permanently locked LP tokens for partner. Cannot be withdrawn after migration.",
    creatorLockedLpPercentage: "Percentage of permanently locked LP tokens for creator. Cannot be withdrawn after migration.",
    creatorTradingFeePercentage: "Percentage of bonding curve trading fees shared to creator (0% to 100%). 0% means all trading fees go to partner.",
    leftover: "Amount of leftover tokens in bonding curve (can be claimed after pool migrates).",
    note: "Total of 4 LP percentages (partner + creator + partnerLocked + creatorLocked) must equal 100%."
  },
  migrationFee: {
    feePercentage: "Percentage fee taken from migration quote threshold when pool migrates (0% to 50%).",
    creatorFeePercentage: "Percentage of migrationFee.feePercentage that creator can claim (0% to 100%)."
  },
  migratedPoolFee: {
    description: "Only configure when migrationOption = DAMM v2 (1) and migrationFeeOption = Customizable (6).",
    collectFeeMode: "0: Quote Token, 1: Output Token",
    dynamicFee: "0: Disabled, 1: Enabled",
    poolFeeBps: "Pool fee in basis points. Minimum 10, maximum 1000 bps."
  },
  tokenUpdateAuthority: {
    title: "Token Update Authority",
    options: {
      "0": "Creator Update Authority - Creator controls metadata updates",
      "1": "Immutable - Metadata is frozen; mint authority is revoked",
      "2": "Partner Update Authority - Partner controls metadata",
      "3": "Creator Update & Mint Authority - Creator controls metadata and minting",
      "4": "Partner Update & Mint Authority - Partner controls metadata and minting"
    }
  },
  leftoverReceiver: "Wallet address that will receive leftover tokens from bonding curve after migration.",
  feeClaimer: "Wallet address that will receive collected fees."
};
