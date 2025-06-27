use anchor_lang::prelude::*;
use anchor_spl::token_interface::{close_account, CloseAccount, TokenAccount, TokenInterface};
use crate::state::*;

// =====================
// Delete BondingCurve
// =====================
#[derive(Accounts)]
pub struct DeleteBondingCurve<'info> {
    #[account(mut, close = receiver)]
    pub bonding_curve: Account<'info, BondingCurve>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}

// =====================
// Delete CurveConfiguration
// =====================
#[derive(Accounts)]
pub struct DeleteCurveConfiguration<'info> {
    #[account(mut, close = receiver)]
    pub curve_configuration: Account<'info, CurveConfiguration>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}

// =====================
// Delete Allocation
// =====================
#[derive(Accounts)]
pub struct DeleteAllocation<'info> {
    #[account(mut, close = receiver)]
    pub allocation: Account<'info, Allocation>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}

// =====================
// Delete LaunchPadAccount
// =====================
#[derive(Accounts)]
pub struct DeleteLaunchPadAccount<'info> {
    #[account(mut, close = receiver)]
    pub launchpad_account: Account<'info, LaunchPadAccount>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}

// =====================
// Delete FairLaunchData
// =====================
#[derive(Accounts)]
pub struct DeleteFairLaunchData<'info> {
    #[account(mut, close = receiver)]
    pub fair_launch_data: Account<'info, FairLaunchData>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}

// =====================
// Delete SPL Token Vaults (pool_token_account, allocation_vault, launchpad_vault)
// =====================
#[derive(Accounts)]
pub struct DeleteVault<'info> {
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    pub vault_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub receiver: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn delete_bonding_curve(_ctx: Context<DeleteBondingCurve>) -> Result<()> {
    Ok(())
}

pub fn delete_curve_configuration(_ctx: Context<DeleteCurveConfiguration>) -> Result<()> {
    Ok(())
}

pub fn delete_allocation(_ctx: Context<DeleteAllocation>) -> Result<()> {
    Ok(())
}

pub fn delete_launchpad_account(_ctx: Context<DeleteLaunchPadAccount>) -> Result<()> {
    Ok(())
}

pub fn delete_fair_launch_data(_ctx: Context<DeleteFairLaunchData>) -> Result<()> {
    Ok(())
}

pub fn delete_vault(ctx: Context<DeleteVault>, vault_seeds: Vec<&[u8]>) -> Result<()> {
    // The vault must be empty before closing
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.receiver.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        },
        &[&vault_seeds[..]],
    ))?;
    Ok(())
}

