import type { DbcConfigWithRelations } from '../types';

/**
 * Validates that all required DBC config relational records are present.
 * Throws descriptive errors if any required records are missing.
 */
export function validateDbcConfigRelations(dbcConfig: DbcConfigWithRelations | null | undefined): void {
  if (!dbcConfig) {
    throw new Error('DBC config is missing');
  }

  // Validate buildCurveParams
  if (!dbcConfig.buildCurveParams) {
    throw new Error('DBC config is missing buildCurveParams');
  }

  // Validate lockedVestingParams
  if (!dbcConfig.lockedVestingParams) {
    throw new Error('DBC config is missing lockedVestingParams');
  }

  // Validate baseFeeParams
  if (!dbcConfig.baseFeeParams) {
    throw new Error('DBC config is missing baseFeeParams');
  }

  // Validate fee params based on baseFeeMode
  const baseFeeMode = dbcConfig.baseFeeParams.baseFeeMode;
  if (baseFeeMode === 0 || baseFeeMode === 1) {
    // Linear or Exponential fee scheduler
    if (!dbcConfig.baseFeeParams.feeSchedulerParams || 
        dbcConfig.baseFeeParams.feeSchedulerParams.length === 0) {
      throw new Error(`DBC config is missing feeSchedulerParams for baseFeeMode ${baseFeeMode}`);
    }
  } else if (baseFeeMode === 2) {
    // Rate limiter
    if (!dbcConfig.baseFeeParams.rateLimiterParams || 
        dbcConfig.baseFeeParams.rateLimiterParams.length === 0) {
      throw new Error(`DBC config is missing rateLimiterParams for baseFeeMode ${baseFeeMode}`);
    }
  }

  // Validate migrationFee
  if (!dbcConfig.migrationFee) {
    throw new Error('DBC config is missing migrationFee');
  }

  // Validate migratedPoolFee if migrationOption requires it
  if (dbcConfig.migrationOption === 1 && dbcConfig.migrationFeeOption === 6) {
    if (!dbcConfig.migratedPoolFee) {
      throw new Error('DBC config is missing migratedPoolFee (required for migrationOption=1 and migrationFeeOption=6)');
    }
  }
}

/**
 * Validates DBC config relations but returns boolean instead of throwing.
 * Useful for non-critical validation checks.
 */
export function isValidDbcConfig(dbcConfig: DbcConfigWithRelations | null | undefined): boolean {
  try {
    validateDbcConfigRelations(dbcConfig);
    return true;
  } catch {
    return false;
  }
}

