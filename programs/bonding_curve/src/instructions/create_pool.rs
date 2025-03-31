use crate::consts::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};

pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
    let bonding_curve_account = &mut ctx.accounts.bonding_curve_account;

    bonding_curve_account.set_inner(BondingCurve::new(
        ctx.accounts.pool_creator.key(),
        ctx.accounts.token_mint.key(),
        ctx.bumps.bonding_curve_account,
    ));

    Ok(())
}

#[derive(Accounts)]
pub struct CreateLiquidityPool<'info> {

    /// Which bonding curve config the pool belongs to.
    pub curve_config: Box<Account<'info, CurveConfiguration>>,

    #[account(
        init,
        space = BondingCurve::ACCOUNT_SIZE,
        payer = pool_creator,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub pool_creator: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
