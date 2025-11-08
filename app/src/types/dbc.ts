import { TokenMetadata } from "./token";

export type MeteoraConfigBase = {
    rpcUrl: string;
    computeUnitPriceMicroLamports: number;
    quoteMint?: string | null;
};
export type FeeSchedulerParams = {
    startingFeeBps: number;
    endingFeeBps: number;
    numberOfPeriod: number;
    totalDuration: number;
};
export type RateLimiterParams = {
    baseFeeBps: number;
    feeIncrementBps: number;
    referenceAmount: number;
    maxLimiterDuration: number;
};
export type BaseFee = {
    baseFeeMode: 0 | 1;
    feeSchedulerParam: FeeSchedulerParams;
} | {
    baseFeeMode: 2;
    rateLimiterParam: RateLimiterParams;
};
export type LockedVesting = {
    totalLockedVestingAmount: number;
    numberOfVestingPeriod: number;
    cliffUnlockAmount: number;
    totalVestingDuration: number;
    cliffDurationFromMigrationTime: number;
};
export type BuildCurveBase = {
    totalTokenSupply: number;
    migrationOption: number;
    tokenBaseDecimal: number;
    tokenQuoteDecimal: number;
    lockedVestingParam: LockedVesting;
    baseFeeParams: BaseFee;
    dynamicFeeEnabled: boolean;
    activationType: number;
    collectFeeMode: number;
    migrationFeeOption: number;
    tokenType: number;
    partnerLpPercentage: number;
    creatorLpPercentage: number;
    partnerLockedLpPercentage: number;
    creatorLockedLpPercentage: number;
    creatorTradingFeePercentage: number;
    leftover: number;
    tokenUpdateAuthority: number;
    migrationFee: {
        feePercentage: number;
        creatorFeePercentage: number;
    };
    leftoverReceiver: string;
    feeClaimer: string;
};
export type BuildCurve = BuildCurveBase & {
    percentageSupplyOnMigration: number;
    migrationQuoteThreshold: number;
};
export type BuildCurveWithMarketCap = BuildCurveBase & {
    initialMarketCap: number;
    migrationMarketCap: number;
};
export type BuildCurveWithTwoSegments = BuildCurveBase & {
    initialMarketCap: number;
    migrationMarketCap: number;
    percentageSupplyOnMigration: number;
};
export type BuildCurveWithLiquidityWeights = BuildCurveBase & {
    initialMarketCap: number;
    migrationMarketCap: number;
    liquidityWeights: number[];
};
export type DbcPool = {
    baseMintKeypairFilepath?: string;
    name: string;
    symbol: string;
    metadata: TokenMetadata;
};
export type DbcSwap = {
    amountIn: number;
    slippageBps: number;
    swapBaseForQuote: boolean;
    referralTokenAccount?: string | null;
};
export type DbcConfig = MeteoraConfigBase & {
    dbcConfig?: (BuildCurve & {
        buildCurveMode: 0;
    }) | (BuildCurveWithMarketCap & {
        buildCurveMode: 1;
    }) | (BuildCurveWithTwoSegments & {
        buildCurveMode: 2;
    }) | (BuildCurveWithLiquidityWeights & {
        buildCurveMode: 3;
    }) | null;
    dbcPool?: DbcPool | null;
    dbcSwap?: DbcSwap | null;
};
