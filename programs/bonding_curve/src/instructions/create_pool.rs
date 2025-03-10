use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::consts::*;

pub fn create_pool(ctx: Context<CreateLiquidityPool>, recipients: Vec<Recipient>) -> Result<()> {
    let bonding_curve_account = &mut ctx.accounts.bonding_curve_account;
    let fee_pool_account = &mut ctx.accounts.fee_pool_account;

    bonding_curve_account.set_inner(BondingCurve::new(
        ctx.accounts.payer.key(),
        ctx.accounts.token_mint.key(),
        ctx.bumps.bonding_curve_account
    ));

    fee_pool_account.set_inner(FeePool::new(recipients, ctx.bumps.fee_pool_account)?);

    Ok(())
}

#[derive(Accounts)]
pub struct CreateLiquidityPool<'info> {
    #[account(
        init,
        space = BondingCurve::ACCOUNT_SIZE,
        payer = payer,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = bonding_curve_account
    )]
    pub pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        space = 8 + 3000,
        payer = payer,
        seeds = [FEE_POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_account: Box<Account<'info, FeePool>>,


    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

