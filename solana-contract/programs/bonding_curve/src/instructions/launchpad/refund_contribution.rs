use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::{
    consts::{LAUNCHPAD_SEED_PREFIX, FAIR_LAUNCH_DATA_SEED_PREFIX, BUYER_SEED_PREFIX, CONTRIBUTION_VAULT_SEED_PREFIX}, 
    state::{LaunchPadAccount, FairLaunchData, BuyerAccount, LaunchType}, 
    errors::{CommonCustomError, LaunchPadCustomErrror}
};

#[derive(Accounts)]
pub struct RefundContribution<'info> {
    #[account(
        mut,
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), launch_pad_account.authority.key().as_ref()],
        bump = launch_pad_account.bump,
        constraint = launch_pad_account.launch_type == LaunchType::FairLaunch @ LaunchPadCustomErrror::InvalidLaunchType,
    )]
    pub launch_pad_account: Box<Account<'info, LaunchPadAccount>>,
    
    #[account(
        mut,
        seeds = [FAIR_LAUNCH_DATA_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump = fair_launch_data.bump,
        constraint = fair_launch_data.launchpad == launch_pad_account.key() @ CommonCustomError::InvalidAuthority,
    )]
    pub fair_launch_data: Box<Account<'info, FairLaunchData>>,
    
    #[account(
        mut,
        seeds = [BUYER_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref(), contributor.key().as_ref()],
        bump,
        constraint = buyer_account.buyer == contributor.key() @ CommonCustomError::InvalidAuthority,
    )]
    pub buyer_account: Box<Account<'info, BuyerAccount>>,
    
    /// CHECK: This is the vault that holds SOL contributions
    #[account(
        mut,
        seeds = [CONTRIBUTION_VAULT_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump,
    )]
    pub contribution_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
    let launch_pad_account = &ctx.accounts.launch_pad_account;
    let fair_launch_data = &mut ctx.accounts.fair_launch_data;
    let buyer_account = &mut ctx.accounts.buyer_account;
    let current_time = Clock::get()?.unix_timestamp;

    // Check if sale has ended
    if current_time <= launch_pad_account.end_time {
        return Err(LaunchPadCustomErrror::SaleNotStarted.into()); // Reusing error, could create SaleNotEnded
    }

    // Check if soft cap was NOT reached (this is when refunds are allowed)
    if fair_launch_data.total_raised >= fair_launch_data.soft_cap {
        return Err(CommonCustomError::InvalidAmount.into()); // Soft cap was reached, no refunds
    }

    // Check if contributor has any amount to refund
    if buyer_account.amount == 0 {
        return Err(CommonCustomError::InvalidAmount.into());
    }

    let refund_amount = buyer_account.amount;

    let launchpad_key = launch_pad_account.key();

    // Transfer SOL from contribution vault back to contributor
    let vault_seeds = &[
        CONTRIBUTION_VAULT_SEED_PREFIX.as_bytes(),
        launchpad_key.as_ref(),
        &[ctx.bumps.contribution_vault],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.contribution_vault.to_account_info(),
                to: ctx.accounts.contributor.to_account_info(),
            },
            signer_seeds,
        ),
        refund_amount,
    )?;

    // Update fair launch data
    fair_launch_data.total_raised = fair_launch_data.total_raised
        .checked_sub(refund_amount)
        .unwrap();

    // Mark buyer as refunded by setting amount to 0
    buyer_account.amount = 0;

    msg!("Refund successful!");
    msg!("Contributor: {}", ctx.accounts.contributor.key());
    msg!("Refund amount: {}", refund_amount);

    Ok(())
} 