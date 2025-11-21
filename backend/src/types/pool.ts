export interface PoolState {
    publicKey: string;
    account: {
      volatilityTracker: {
        lastUpdateTimestamp: string;
        padding: number[];
        sqrtPriceReference: string;
        volatilityAccumulator: string;
        volatilityReference: string;
      };
      config: string;
      creator: string;
      baseMint: string;
      baseVault: string;
      quoteVault: string;
      baseReserve: string;
      quoteReserve: string;
      protocolBaseFee: string;
      protocolQuoteFee: string;
      partnerBaseFee: string;
      partnerQuoteFee: string;
      sqrtPrice: string;
      activationPoint: string;
      poolType: number;
      isMigrated: number;
      isPartnerWithdrawSurplus: number;
      isProtocolWithdrawSurplus: number;
      migrationProgress: number;
      isWithdrawLeftover: number;
      isCreatorWithdrawSurplus: number;
      migrationFeeWithdrawStatus: number;
      metrics: {
        totalProtocolBaseFee: string;
        totalProtocolQuoteFee: string;
        totalTradingBaseFee: string;
        totalTradingQuoteFee: string;
      };
      finishCurveTimestamp: string;
      creatorBaseFee: string;
      creatorQuoteFee: string;
      padding1: string[];
    };
}
  
export interface PoolConfig {
    quoteMint: string;
    feeClaimer: string;
    leftoverReceiver: string;
    poolFees: {
      baseFee: {
        cliffFeeNumerator: string;
        secondFactor: string;
        thirdFactor: string;
        firstFactor: number;
        baseFeeMode: number;
        padding0: number[];
      };
      dynamicFee: {
        initialized: number;
        padding: number[];
        maxVolatilityAccumulator: number;
        variableFeeControl: number;
        binStep: number;
        filterPeriod: number;
        decayPeriod: number;
        reductionFactor: number;
        padding2: number[];
        binStepU128: string;
      };
      padding0: string[];
      padding1: number[];
      protocolFeePercent: number;
      referralFeePercent: number;
    };
    collectFeeMode: number;
    migrationOption: number;
    activationType: number;
    tokenDecimal: number;
    version: number;
    tokenType: number;
    quoteTokenFlag: number;
    partnerLockedLpPercentage: number;
    partnerLpPercentage: number;
    creatorLockedLpPercentage: number;
    creatorLpPercentage: number;
    migrationFeeOption: number;
    fixedTokenSupplyFlag: number;
    creatorTradingFeePercentage: number;
    tokenUpdateAuthority: number;
    migrationFeePercentage: number;
    creatorMigrationFeePercentage: number;
    padding0: number[];
    swapBaseAmount: string;
    migrationQuoteThreshold: string;
    migrationBaseThreshold: string;
    migrationSqrtPrice: string;
    lockedVestingConfig: {
      amountPerPeriod: string;
      cliffDurationFromMigrationTime: string;
      frequency: string;
      numberOfPeriod: string;
      cliffUnlockAmount: string;
      padding: string;
    };
    preMigrationTokenSupply: string;
    postMigrationTokenSupply: string;
    migratedCollectFeeMode: number;
    migratedDynamicFee: number;
    migratedPoolFeeBps: number;
    padding1: number[];
    padding2: string;
    sqrtStartPrice: string;
    curve: Array<{
      sqrtPrice: string;
      liquidity: string;
    }>;
  }