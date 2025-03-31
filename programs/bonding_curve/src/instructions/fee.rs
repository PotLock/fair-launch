use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::consts::*;
use crate::errors::CustomError;
use crate::state::{BondingCurve, CurveConfiguration, FeePool, FeePoolAccount, Recipient};

pub fn add_fee_recipients(ctx: Context<AddFeeRecipient>, recipients: Vec<Recipient>) -> Result<()> {
    msg!("Trying to add fee recipient");

    let fee_pool = &mut ctx.accounts.fee_pool_account;

    fee_pool.add_fee_recipients(recipients)?;
    Ok(())
}

pub fn claim_fee(ctx: Context<ClaimFee>, bump: u8) -> Result<()> {
    let fee_pool = &mut ctx.accounts.fee_pool_account;
    let fee_pool_vault = &mut ctx.accounts.fee_pool_vault;
    let token = &mut ctx.accounts.token_mint.to_account_info();
    let system_program = &mut ctx.accounts.system_program;

    let user = &ctx.accounts.user;

    fee_pool.claim_fee(user, fee_pool_vault, token, system_program, bump)?;
    Ok(())
}

#[derive(Accounts)]
pub struct AddFeeRecipient<'info> {

    /// Which bonding curve config the pool belongs to.
    pub curve_config: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump = bonding_curve_account.bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_account: Box<Account<'info, FeePool>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_vault: AccountInfo<'info>,

    #[account(constraint = authority.key() == bonding_curve_account.creator @ CustomError::InvalidAuthority)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimFee<'info> {
    /// Which bonding curve config the pool belongs to.
    pub curve_config: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump = bonding_curve_account.bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_account: Box<Account<'info, FeePool>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [FEE_POOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_vault: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
