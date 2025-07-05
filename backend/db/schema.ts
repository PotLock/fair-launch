import { pgTable, serial, text, varchar, integer, boolean, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Bảng chính lưu thông tin token
export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  description: text('description'),
  supply: varchar('supply', { length: 100 }).notNull(),
  decimals: varchar('decimals', { length: 10 }).notNull(),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  
  // Template và pricing
  selectedTemplate: varchar('selected_template', { length: 100 }).notNull(),
  selectedPricing: varchar('selected_pricing', { length: 100 }).notNull(),
  selectedExchange: varchar('selected_exchange', { length: 100 }).notNull(),
  
  // Social links
  website: text('website'),
  twitter: text('twitter'),
  telegram: text('telegram'),
  discord: text('discord'),
  farcaster: text('farcaster'),
  
  initialPrice: varchar('initial_price', { length: 100 }),
  finalPrice: varchar('final_price', { length: 100 }),
  targetRaise: varchar('target_raise', { length: 100 }),
  reserveRatio: varchar('reserve_ratio', { length: 100 }),
  curveType: varchar('curve_type', { length: 50 }),
  
  launchLiquidityOnName: varchar('launch_liquidity_on_name', { length: 100 }),
  liquiditySource: varchar('liquidity_source', { length: 50 }),
  liquidityData: jsonb('liquidity_data'),
  liquidityType: varchar('liquidity_type', { length: 50 }),
  liquidityPercentage: integer('liquidity_percentage'),
  liquidityLockupPeriod: integer('liquidity_lockup_period'),
  isAutoBotProtectionEnabled: boolean('is_auto_bot_protection_enabled'),
  isAutoListingEnabled: boolean('is_auto_listing_enabled'),
  isPriceProtectionEnabled: boolean('is_price_protection_enabled'),
  
  mintFee: decimal('mint_fee', { precision: 10, scale: 2 }),
  transferFee: decimal('transfer_fee', { precision: 10, scale: 2 }),
  burnFee: decimal('burn_fee', { precision: 10, scale: 2 }),
  feeRecipientAddress: varchar('fee_recipient_address', { length: 255 }),
  adminControlsEnabled: boolean('admin_controls_enabled'),
  adminControlsWalletAddress: varchar('admin_controls_wallet_address', { length: 255 }),
  
  // Sale setup
  softCap: varchar('soft_cap', { length: 100 }),
  hardCap: varchar('hard_cap', { length: 100 }),
  scheduleLaunchEnabled: boolean('schedule_launch_enabled'),
  launchDate: timestamp('launch_date'),
  endDate: timestamp('end_date'),
  minimumContribution: varchar('minimum_contribution', { length: 100 }),
  maximumContribution: varchar('maximum_contribution', { length: 100 }),
  tokenPrice: varchar('token_price', { length: 100 }),
  maxTokenPerWallet: varchar('max_token_per_wallet', { length: 100 }),
  distributionDelay: integer('distribution_delay'),
  
  // Admin setup
  revokeMintAuthorityEnabled: boolean('revoke_mint_authority_enabled'),
  revokeMintAuthorityWalletAddress: varchar('revoke_mint_authority_wallet_address', { length: 255 }),
  revokeFreezeAuthorityEnabled: boolean('revoke_freeze_authority_enabled'),
  revokeFreezeAuthorityWalletAddress: varchar('revoke_freeze_authority_wallet_address', { length: 255 }),
  adminWalletAddress: varchar('admin_wallet_address', { length: 255 }),
  adminStructure: varchar('admin_structure', { length: 50 }),
  tokenOwnerWalletAddress: varchar('token_owner_wallet_address', { length: 255 }),
  numberOfSignatures: integer('number_of_signatures'),
  mintAuthorityWalletAddress: varchar('mint_authority_wallet_address', { length: 255 }),
  freezeAuthorityWalletAddress: varchar('freeze_authority_wallet_address', { length: 255 }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bảng lưu thông tin allocation/vesting
export const tokenAllocations = pgTable('token_allocations', {
  id: serial('id').primaryKey(),
  tokenId: integer('token_id').references(() => tokens.id, { onDelete: 'cascade' }),
  description: text('description'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  lockupPeriod: integer('lockup_period'),
  
  // Vesting info
  vestingEnabled: boolean('vesting_enabled'),
  vestingDescription: text('vesting_description'),
  vestingPercentage: decimal('vesting_percentage', { precision: 5, scale: 2 }),
  vestingCliff: integer('vesting_cliff'),
  vestingDuration: integer('vesting_duration'),
  vestingInterval: integer('vesting_interval'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const tokensRelations = relations(tokens, ({ many }) => ({
  allocations: many(tokenAllocations),
}));

export const tokenAllocationsRelations = relations(tokenAllocations, ({ one }) => ({
  token: one(tokens, {
    fields: [tokenAllocations.tokenId],
    references: [tokens.id],
  }),
})); 