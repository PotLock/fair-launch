use crate::consts::*;
use crate::state::*;
use crate::utils::calculate_initial_reserve_linear;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

pub fn create_pool(ctx: Context<CreateLiquidityPool>) -> Result<()> {
    let bonding_curve_account = &mut ctx.accounts.bonding_curve_account;
    let bonding_curve_configuration = &ctx.accounts.bonding_curve_configuration;
    bonding_curve_account.set_inner(BondingCurve::new(
        ctx.accounts.user.key(),
        ctx.accounts.token_mint.key(),
        ctx.bumps.bonding_curve_account,
    ));

    // calculate the initial reserve amount based on the initial price (SOL) and initial supply (token)
    let initial_reserve_amount = calculate_initial_reserve_linear(
        bonding_curve_configuration.initial_reserve,
        bonding_curve_configuration.initial_supply,
        bonding_curve_account.reserve_ratio,
        ctx.accounts.token_mint.decimals,
    )?;
    msg!("initial reserve amount {:?}", initial_reserve_amount);

    let token_one_accounts = (
        &mut *ctx.accounts.token_mint,
        &mut *ctx.accounts.pool_token_account,
        &mut *ctx.accounts.user_token_account,
    );
    msg!("initial supply {:?}", bonding_curve_configuration.initial_supply);
    // add the initial reserve amount to the new pool
    bonding_curve_account.add_liquidity(
        token_one_accounts,
        &mut ctx.accounts.pool_sol_vault,
        bonding_curve_configuration.initial_supply,
        initial_reserve_amount,
        bonding_curve_configuration.locked_liquidity,
        &ctx.accounts.user,
        &ctx.accounts.token_program,
        &ctx.accounts.system_program,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateLiquidityPool<'info> {
    #[account(
        mut,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes()],
        bump,
    )]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,

    #[account(
        init,
        space = BondingCurve::ACCOUNT_SIZE,
        payer = user,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,


    #[account(
        mint::token_program = token_program
    )]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        token::token_program = token_program,
        associated_token::token_program = token_program,
        associated_token::mint = token_mint,
        associated_token::authority = bonding_curve_account,
        payer = user,
    )]
    pub pool_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This is a vault solana account for the pool
    #[account(
        mut,
        seeds = [SOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: AccountInfo<'info>,


    #[account(mut, 
        associated_token::mint = token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
