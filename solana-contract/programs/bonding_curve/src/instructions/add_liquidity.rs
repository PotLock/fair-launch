use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::consts::*;
use crate::errors::CustomError;
use crate::state::{BondingCurve, BondingCurveAccount, CurveConfiguration};

pub fn add_liquidity(ctx: Context<AddLiquidity>, amount: u64) -> Result<()> {
    msg!("Trying to add liquidity to the pool");

    let bonding_curve = &mut ctx.accounts.bonding_curve_account;
    let bonding_curve_configuration = &ctx.accounts.dex_configuration_account;
    let user = &ctx.accounts.user;
    // check if the user is the creator of the pool
    if bonding_curve.creator != user.key() {
        return Err(CustomError::InvalidAuthority.into());
    }

    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let pool_sol_vault = &mut ctx.accounts.pool_sol_vault;

    let token_one_accounts = (
        &mut *ctx.accounts.token_mint,
        &mut *ctx.accounts.pool_token_account,
        &mut *ctx.accounts.user_token_account,
    );

    bonding_curve.add_liquidity(
        token_one_accounts,
        pool_sol_vault,
        amount,
        bonding_curve_configuration.locked_liquidity,
        user,
        token_program,
        system_program,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
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
