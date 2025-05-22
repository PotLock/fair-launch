use anchor_lang::prelude::*;

pub mod consts;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;
use crate::state::Recipient;
declare_id!("7bQSomZtcGWy7K6f5hjFx3HmYDSCP2keUL9jD1NsfmtM");

#[program]
pub mod bonding_curve {
    use crate::state::Recipient;

    use super::*;

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
        )
    }

    pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
        instructions::create_pool(ctx)
    }

    pub fn buy<'info>(ctx: Context<'_, '_, '_, 'info, Buy<'info>>, amount: u64) -> Result<()> {
        instructions::buy(ctx, amount)
    }

    pub fn sell<'info>(ctx: Context<'_, '_, '_, 'info, Sell<'info>>, amount: u64, bump: u8) -> Result<()> {
        instructions::sell(ctx, amount, bump)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, sol_amount: u64, token_amount: u64) -> Result<()> {
        instructions::add_liquidity(ctx, sol_amount, token_amount)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, bump: u8) -> Result<()> {
        instructions::remove_liquidity(ctx, bump)
    }

    // // Only DAO can grant this permission
    pub fn add_fee_recipients(
        ctx: Context<AddFeeRecipient>,
        recipients: Vec<Recipient>,
    ) -> Result<()> {
        instructions::add_fee_recipients(ctx, recipients)
    }

    pub fn migrate_meteora_pool(ctx: Context<InitializeMeteoraPool>) -> Result<()> {
        instructions::initialize_pool_meteora_with_config(ctx)
    }

    pub fn migrate_pumpswap_pool(ctx: Context<InitializePumpswapPool>, index: u16) -> Result<()> {
        instructions::initialize_pool_pumpswap(ctx, index)
    }

}
