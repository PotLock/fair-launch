import { pgTable, text, integer, boolean, timestamp, decimal, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Main tokens table
export const tokens = pgTable('tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  mintAddress: varchar('mint_address', { length: 44 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  description: text('description'),
  totalSupply: decimal('total_supply', { precision: 20, scale: 9 }).notNull(),
  decimals: integer('decimals').notNull().default(6),
  owner: varchar('owner', { length: 44 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Token metadata table
export const tokenMetadata = pgTable('token_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').notNull().references(() => tokens.id, { onDelete: 'cascade' }),
  tokenUri: text('token_uri'),
  bannerUri: text('banner_uri'),
  website: text('website'),
  twitter: text('twitter'),
  telegram: text('telegram'),
  metadataUri: text('metadata_uri'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// DBC Configuration table
export const dbcConfigs = pgTable('dbc_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').notNull().references(() => tokens.id, { onDelete: 'cascade' }),
  quoteMint: varchar('quote_mint', { length: 44 }).notNull(), // SOL, USDC, or other token address
  buildCurveMode: integer('build_curve_mode').notNull(), // 0-3
  totalTokenSupply: decimal('total_token_supply', { precision: 20, scale: 9 }).notNull(),
  migrationOption: integer('migration_option').notNull(), // 0: DAMM v1, 1: DAMM v2
  tokenBaseDecimal: integer('token_base_decimal').notNull(),
  tokenQuoteDecimal: integer('token_quote_decimal').notNull(),
  dynamicFeeEnabled: boolean('dynamic_fee_enabled').notNull().default(true),
  activationType: integer('activation_type').notNull(), // 0: Slot, 1: Timestamp
  collectFeeMode: integer('collect_fee_mode').notNull(), // 0: Quote Token, 1: Output Token
  migrationFeeOption: integer('migration_fee_option').notNull(), // 0-5: LP Fee options
  tokenType: integer('token_type').notNull(), // 0: SPL, 1: Token 2022
  partnerLpPercentage: decimal('partner_lp_percentage', { precision: 5, scale: 2 }).notNull(),
  creatorLpPercentage: decimal('creator_lp_percentage', { precision: 5, scale: 2 }).notNull(),
  partnerLockedLpPercentage: decimal('partner_locked_lp_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  creatorLockedLpPercentage: decimal('creator_locked_lp_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  creatorTradingFeePercentage: decimal('creator_trading_fee_percentage', { precision: 5, scale: 2 }).notNull(),
  leftover: decimal('leftover', { precision: 20, scale: 9 }).notNull().default('0'),
  tokenUpdateAuthority: integer('token_update_authority').notNull(), // 0-4: Authority options
  leftoverReceiver: varchar('leftover_receiver', { length: 44 }).notNull(),
  feeClaimer: varchar('fee_claimer', { length: 44 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Build curve specific parameters table
export const buildCurveParams = pgTable('build_curve_params', {
  id: uuid('id').primaryKey().defaultRandom(),
  dbcConfigId: uuid('dbc_config_id').notNull().references(() => dbcConfigs.id, { onDelete: 'cascade' }),
  buildCurveMode: integer('build_curve_mode').notNull(),
  // For buildCurve (0)
  percentageSupplyOnMigration: decimal('percentage_supply_on_migration', { precision: 5, scale: 2 }),
  migrationQuoteThreshold: decimal('migration_quote_threshold', { precision: 20, scale: 9 }),
  // For buildCurveWithMarketCap (1) and buildCurveWithTwoSegments (2)
  initialMarketCap: decimal('initial_market_cap', { precision: 20, scale: 9 }),
  migrationMarketCap: decimal('migration_market_cap', { precision: 20, scale: 9 }),
  // For buildCurveWithLiquidityWeights (3)
  liquidityWeights: jsonb('liquidity_weights'), // Array of 16 numbers
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Locked vesting parameters table
export const lockedVestingParams = pgTable('locked_vesting_params', {
  id: uuid('id').primaryKey().defaultRandom(),
  dbcConfigId: uuid('dbc_config_id').notNull().references(() => dbcConfigs.id, { onDelete: 'cascade' }),
  totalLockedVestingAmount: decimal('total_locked_vesting_amount', { precision: 20, scale: 9 }).notNull().default('0'),
  numberOfVestingPeriod: integer('number_of_vesting_period').notNull().default(0),
  cliffUnlockAmount: decimal('cliff_unlock_amount', { precision: 20, scale: 9 }).notNull().default('0'),
  totalVestingDuration: integer('total_vesting_duration').notNull().default(0), // in seconds
  cliffDurationFromMigrationTime: integer('cliff_duration_from_migration_time').notNull().default(0), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Base fee parameters table
export const baseFeeParams = pgTable('base_fee_params', {
  id: uuid('id').primaryKey().defaultRandom(),
  dbcConfigId: uuid('dbc_config_id').notNull().references(() => dbcConfigs.id, { onDelete: 'cascade' }),
  baseFeeMode: integer('base_fee_mode').notNull(), // 0: Linear, 1: Exponential, 2: Rate Limiter
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Fee scheduler parameters table
export const feeSchedulerParams = pgTable('fee_scheduler_params', {
  id: uuid('id').primaryKey().defaultRandom(),
  baseFeeParamsId: uuid('base_fee_params_id').notNull().references(() => baseFeeParams.id, { onDelete: 'cascade' }),
  startingFeeBps: integer('starting_fee_bps').notNull(), // max 9900 bps
  endingFeeBps: integer('ending_fee_bps').notNull(), // min 1 bps
  numberOfPeriod: integer('number_of_period').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rate limiter parameters table
export const rateLimiterParams = pgTable('rate_limiter_params', {
  id: uuid('id').primaryKey().defaultRandom(),
  baseFeeParamsId: uuid('base_fee_params_id').notNull().references(() => baseFeeParams.id, { onDelete: 'cascade' }),
  baseFeeBps: integer('base_fee_bps').notNull(), // max 9900 bps
  feeIncrementBps: integer('fee_increment_bps').notNull(), // max 9900 bps
  referenceAmount: decimal('reference_amount', { precision: 20, scale: 9 }).notNull().default('0'),
  maxLimiterDuration: integer('max_limiter_duration').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Migration fee table
export const migrationFees = pgTable('migration_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  dbcConfigId: uuid('dbc_config_id').notNull().references(() => dbcConfigs.id, { onDelete: 'cascade' }),
  feePercentage: decimal('fee_percentage', { precision: 5, scale: 2 }).notNull().default('0'), // 0-50%
  creatorFeePercentage: decimal('creator_fee_percentage', { precision: 5, scale: 2 }).notNull().default('0'), // 0-100%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Migrated pool fee table (optional, only for migrationOption = 1 and migrationFeeOption = 6)
export const migratedPoolFees = pgTable('migrated_pool_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  dbcConfigId: uuid('dbc_config_id').notNull().references(() => dbcConfigs.id, { onDelete: 'cascade' }),
  collectFeeMode: integer('collect_fee_mode').notNull(), // 0: Quote Token, 1: Output Token
  dynamicFee: integer('dynamic_fee').notNull(), // 0: Disabled, 1: Enabled
  poolFeeBps: integer('pool_fee_bps').notNull(), // 10-1000 bps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Token transactions table (for tracking token operations)
export const tokenTransactions = pgTable('token_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').notNull().references(() => tokens.id, { onDelete: 'cascade' }),
  transactionHash: varchar('transaction_hash', { length: 88 }).notNull(),
  operation: varchar('operation', { length: 50 }).notNull(), // create-config, create-pool, migrate, etc.
  status: varchar('status', { length: 20 }).notNull(), // pending, confirmed, failed
  amount: decimal('amount', { precision: 20, scale: 9 }),
  fee: decimal('fee', { precision: 20, scale: 9 }),
  fromAddress: varchar('from_address', { length: 44 }),
  toAddress: varchar('to_address', { length: 44 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relationships
export const tokensRelations = relations(tokens, ({ one, many }) => ({
  metadata: one(tokenMetadata),
  dbcConfig: one(dbcConfigs),
  transactions: many(tokenTransactions),
}));

export const tokenMetadataRelations = relations(tokenMetadata, ({ one }) => ({
  token: one(tokens, {
    fields: [tokenMetadata.tokenId],
    references: [tokens.id],
  }),
}));

export const dbcConfigsRelations = relations(dbcConfigs, ({ one, many }) => ({
  token: one(tokens, {
    fields: [dbcConfigs.tokenId],
    references: [tokens.id],
  }),
  buildCurveParams: one(buildCurveParams),
  lockedVestingParams: one(lockedVestingParams),
  baseFeeParams: one(baseFeeParams),
  migrationFee: one(migrationFees),
  migratedPoolFee: one(migratedPoolFees),
}));

export const buildCurveParamsRelations = relations(buildCurveParams, ({ one }) => ({
  dbcConfig: one(dbcConfigs, {
    fields: [buildCurveParams.dbcConfigId],
    references: [dbcConfigs.id],
  }),
}));

export const lockedVestingParamsRelations = relations(lockedVestingParams, ({ one }) => ({
  dbcConfig: one(dbcConfigs, {
    fields: [lockedVestingParams.dbcConfigId],
    references: [dbcConfigs.id],
  }),
}));

export const baseFeeParamsRelations = relations(baseFeeParams, ({ one, many }) => ({
  dbcConfig: one(dbcConfigs, {
    fields: [baseFeeParams.dbcConfigId],
    references: [dbcConfigs.id],
  }),
  feeSchedulerParams: many(feeSchedulerParams),
  rateLimiterParams: many(rateLimiterParams),
}));

export const feeSchedulerParamsRelations = relations(feeSchedulerParams, ({ one }) => ({
  baseFeeParams: one(baseFeeParams, {
    fields: [feeSchedulerParams.baseFeeParamsId],
    references: [baseFeeParams.id],
  }),
}));

export const rateLimiterParamsRelations = relations(rateLimiterParams, ({ one }) => ({
  baseFeeParams: one(baseFeeParams, {
    fields: [rateLimiterParams.baseFeeParamsId],
    references: [baseFeeParams.id],
  }),
}));

export const migrationFeesRelations = relations(migrationFees, ({ one }) => ({
  dbcConfig: one(dbcConfigs, {
    fields: [migrationFees.dbcConfigId],
    references: [dbcConfigs.id],
  }),
}));

export const migratedPoolFeesRelations = relations(migratedPoolFees, ({ one }) => ({
  dbcConfig: one(dbcConfigs, {
    fields: [migratedPoolFees.dbcConfigId],
    references: [dbcConfigs.id],
  }),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  token: one(tokens, {
    fields: [tokenTransactions.tokenId],
    references: [tokens.id],
  }),
}));
