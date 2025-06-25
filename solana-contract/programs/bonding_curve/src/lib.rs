use anchor_lang::prelude::*;

pub mod consts;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;
use crate::state::Recipient;
use crate::instructions::allocation::{CreateAllocation, ClaimTokens, create_allocation, claim_tokens};
use crate::state::allocation::Vesting;
declare_id!("2133PDFLFMiJyzqKU55up2wThH68QjVFjtrtC5Mx91TY");

#[program]
pub mod bonding_curve {
    use crate::state::Recipient;

    use super::*;

    // ============================================================================
    // Bonding Curve Functions
    // ============================================================================

    pub fn initialize(
        ctx: Context<InitializeBondingCurve>,
        admin: Pubkey,
        fee_percentage: u16,
        initial_quorum: u64,
        target_liquidity: u64,
        governance: Pubkey,
        dao_quorum: u16,
        bonding_curve_type: u8,
        max_token_supply: u64,
        liquidity_lock_period: i64,
        liquidity_pool_percentage: u16,
        initial_reserve: u64,
        initial_supply: u64,
        recipients: Vec<Recipient>,
        reserve_ratio: u16,
    ) -> Result<()> {
        instructions::initialize(
            ctx,
            admin,
            fee_percentage,
            initial_quorum,
            target_liquidity,
            governance,
            dao_quorum,
            bonding_curve_type,
            max_token_supply,
            liquidity_lock_period,
            liquidity_pool_percentage,
            initial_reserve,
            initial_supply,
            recipients,
            reserve_ratio,
        )
    }

    pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
        instructions::create_pool(ctx)
    }

    pub fn buy<'info>(ctx: Context<'_, '_, '_, 'info, Buy<'info>>, amount: u64) -> Result<()> {
        instructions::buy(ctx, amount)
    }

    pub fn sell<'info>(
        ctx: Context<'_, '_, '_, 'info, Sell<'info>>,
        amount: u64,
        bump: u8,
    ) -> Result<()> {
        instructions::sell(ctx, amount, bump)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        sol_amount: u64,
        token_amount: u64,
    ) -> Result<()> {
        instructions::add_liquidity(ctx, sol_amount, token_amount)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, bump: u8) -> Result<()> {
        instructions::remove_liquidity(ctx, bump)
    }

    // ============================================================================
    // Admin Functions : Bonding Curve
    // ============================================================================
    pub fn add_fee_recipients(
        ctx: Context<AddFeeRecipient>,
        recipients: Vec<Recipient>,
    ) -> Result<()> {
        instructions::add_fee_recipients(ctx, recipients)
    }
    pub fn change_fee_admin(ctx: Context<ChangeFeeAdmin>, new_fee_admin: Pubkey) -> Result<()> {
        instructions::change_fee_admin(ctx, new_fee_admin)
    }

    // ============================================================================
    // Migrate Liquidity Pool Bonding Curve to DEX
    // ============================================================================


    pub fn migrate_meteora_pool(ctx: Context<InitializeMeteoraPool>) -> Result<()> {
        instructions::initialize_pool_meteora_with_config(ctx)
    }

    pub fn migrate_pumpswap_pool(ctx: Context<InitializePumpswapPool>, index: u16) -> Result<()> {
        instructions::initialize_pool_pumpswap(ctx, index)
    }


    // ============================================================================
    // Whitelist Launchpad Functions
    // ============================================================================

    pub fn create_whitelist_launch(
        ctx: Context<CreateWhitelistLaunch>, 
        token_price: u64, 
        purchase_limit_per_wallet: u64, 
        total_supply: u64,
        whitelist_duration: i64, 
        start_time: i64, 
        end_time: i64
    ) -> Result<()> {
        instructions::create_whitelist_launch(ctx, token_price, purchase_limit_per_wallet, total_supply, whitelist_duration, start_time, end_time)
    }
    pub fn add_whitelist(ctx: Context<AddWhitelist>, user: Pubkey) -> Result<()> {
        instructions::add_whitelist(ctx, user)
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhitelist>, user: Pubkey) -> Result<()> {
        instructions::remove_whitelist(ctx, user)
    }

    // ============================================================================
    // Fair Launch Functions
    // ============================================================================

    pub fn create_fair_launch(
        ctx: Context<CreateFairLaunch>, 
        soft_cap: u64,
        hard_cap: u64,
        start_time: i64,
        end_time: i64,
        min_contribution: u64,
        max_contribution: u64,
        max_tokens_per_wallet: u64,
        distribution_delay: i64,
    ) -> Result<()> {
        instructions::create_fair_launch(
            ctx, 
            soft_cap,
            hard_cap,
            start_time,
            end_time,
            min_contribution,
            max_contribution,
            max_tokens_per_wallet,
            distribution_delay,
        )
    }

    pub fn contribute_fair_launch(
        ctx: Context<ContributeFairLaunch>,
        amount: u64,
    ) -> Result<()> {
        instructions::contribute_fair_launch(ctx, amount)
    }

    pub fn distribute_tokens(ctx: Context<DistributeTokens>) -> Result<()> {
        instructions::distribute_tokens(ctx)
    }

    pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
        instructions::refund_contribution(ctx)
    }

    // ============================================================================
    // Admin Pause & Unpause Functions : Launchpad
    // ============================================================================

    pub fn pause_launchpad(ctx: Context<PauseLaunchPad>) -> Result<()> {
        instructions::pause_launchpad(ctx)
    }

    pub fn unpause_launchpad(ctx: Context<UnpauseLaunchPad>) -> Result<()> {
        instructions::unpause_launchpad(ctx)
    }

    // ============================================================================
    // Token Distribution & Vesting
    // ============================================================================
    pub fn create_allocation(
        ctx: Context<CreateAllocation>,
        category: String,
        percentage: u8,
        total_tokens: u64,
        vesting: Option<Vesting>,
    ) -> Result<()> {
        instructions::create_allocation(ctx, category, percentage, total_tokens, vesting)
    }

    pub fn claim_tokens(
        ctx: Context<ClaimTokens>,
        now: i64,
    ) -> Result<u64> {
        instructions::claim_tokens(ctx, now)
    }
}
