use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::consts::*;
use crate::state::{BondingCurve, BondingCurveAccount, CurveConfiguration, FeePool};

pub fn buy(ctx: Context<Buy>, amount: u64) -> Result<()> {
    msg!("Trying to buy from the pool");
    // TODO: Implement buy function
    let bonding_curve = &mut ctx.accounts.bonding_curve_account;
    let bonding_curve_configuration = &ctx.accounts.dex_configuration_account;

    let user = &ctx.accounts.user;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let pool_sol_vault = &mut ctx.accounts.pool_sol_vault;
    let fee_pool_account = &mut ctx.accounts.fee_pool_account;
    let fee_pool_vault = &mut ctx.accounts.fee_pool_vault;

    let bonding_curve_type: u8 = bonding_curve_configuration.bonding_curve_type.into();
    let fee_percentage: u16 = bonding_curve_configuration.fee_percentage;
    let token_one_accounts = (
        &mut *ctx.accounts.token_mint,
        &mut *ctx.accounts.pool_token_account,
        &mut *ctx.accounts.user_token_account,
    );

    bonding_curve.buy(
        token_one_accounts,
        pool_sol_vault,
        fee_pool_account,
        fee_pool_vault,
        amount,
        fee_percentage,
        user,
        bonding_curve_type,
        token_program,
        system_program,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(
        mut,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump = bonding_curve_account.bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = bonding_curve_account
    )]
    pub pool_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [SOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: AccountInfo<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump,
    )]
    pub fee_pool_account: Box<Account<'info, FeePool>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_vault: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
