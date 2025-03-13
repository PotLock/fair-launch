use anchor_lang::prelude::*;

pub mod consts;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;

declare_id!("65jtKVsceUHnuj5rK4e7dqyjy8cn2GEXvp1jkyYnGKD");

#[program]
pub mod bonding_curve {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializeBondingCurve>,
        fee_percentage: u16,
        initial_quorum: u64,
        target_liquidity: u64,
        governance: Pubkey,
        dao_quorum: u16,
        bonding_curve_type: u8,
    ) -> Result<()> {
        instructions::initialize(
            ctx,
            fee_percentage,
            initial_quorum,
            target_liquidity,
            governance,
            dao_quorum,
            bonding_curve_type
        )
    }

    pub fn create_pool(ctx: Context<CreateLiquidityPool>, recipients: Vec<state::Recipient>) -> Result<()> {
        instructions::create_pool(ctx, recipients)
    }

    pub fn buy(ctx: Context<Buy>, amount: u64) -> Result<()> {
        instructions::buy(ctx, amount)
    }

    pub fn sell(ctx: Context<Sell>, amount: u64, bump: u8) -> Result<()> {
        instructions::sell(ctx, amount, bump)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
        instructions::add_liquidity(ctx, amount)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, bump: u8) -> Result<()> {
        instructions::remove_liquidity(ctx, bump)
    }

    // Only DAO can grant this permission
    pub fn add_fee_recipients(ctx: Context<AddFeeRecipient>, recipients: Vec<state::Recipient>) -> Result<()> {
        instructions::add_fee_recipients(ctx, recipients)
    }

    pub fn claim_fee(ctx: Context<ClaimFee>, bump: u8) -> Result<()> {
        instructions::claim_fee(ctx, bump)
    }
}
