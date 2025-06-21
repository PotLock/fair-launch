use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::{
    consts::{LAUNCHPAD_SEED_PREFIX, FAIR_LAUNCH_DATA_SEED_PREFIX, BUYER_SEED_PREFIX, FAIR_LAUNCH_VAULT_SEED_PREFIX}, 
    state::{LaunchPadAccount, FairLaunchData, BuyerAccount, LaunchType}, 
    errors::{LaunchPadCustomErrror, CommonCustomError}
};

#[derive(Accounts)]
pub struct ContributeFairLaunch<'info> {
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
        init_if_needed,
        seeds = [BUYER_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref(), contributor.key().as_ref()],
        bump,
        payer = contributor,
        space = 8 + std::mem::size_of::<BuyerAccount>(),
    )]
    pub buyer_account: Box<Account<'info, BuyerAccount>>,
    
    /// CHECK: This is the vault that will receive SOL contributions
    #[account(
        mut,
        seeds = [FAIR_LAUNCH_VAULT_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump,
    )]
    pub contribution_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn contribute_fair_launch(
    ctx: Context<ContributeFairLaunch>,
    amount: u64,
) -> Result<()> {
    let launch_pad_account = &mut ctx.accounts.launch_pad_account;
    let fair_launch_data = &mut ctx.accounts.fair_launch_data;
    let buyer_account = &mut ctx.accounts.buyer_account;
    let current_time = Clock::get()?.unix_timestamp;

    // Check if launchpad is paused
    if launch_pad_account.paused {
        return Err(LaunchPadCustomErrror::SaleIsPaused.into());
    }

    // Check if sale has started
    if current_time < launch_pad_account.start_time {
        return Err(LaunchPadCustomErrror::SaleNotStarted.into());
    }

    // Check if sale has ended
    if current_time > launch_pad_account.end_time {
        return Err(LaunchPadCustomErrror::SaleEnded.into());
    }

    // Check if hard cap would be exceeded
    if fair_launch_data.total_raised.checked_add(amount).unwrap() > fair_launch_data.hard_cap {
        return Err(LaunchPadCustomErrror::HardCapReached.into());
    }

    // Check minimum contribution
    if amount < fair_launch_data.min_contribution {
        return Err(LaunchPadCustomErrror::ContributionBelowMinimum.into());
    }

    // Check maximum contribution per wallet
    let total_contribution = buyer_account.amount.checked_add(amount).unwrap();
    if total_contribution > fair_launch_data.max_contribution {
        return Err(LaunchPadCustomErrror::ContributionExceedsMaximum.into());
    }

    // Check max tokens per wallet (calculate tokens based on contribution and price)
    let tokens_to_receive = total_contribution
        .checked_div(launch_pad_account.token_price)
        .unwrap()
        .checked_mul(10u64.pow(9)) // Assuming 9 decimals
        .unwrap();
    
    if tokens_to_receive > fair_launch_data.max_tokens_per_wallet {
        return Err(LaunchPadCustomErrror::MaxTokensPerWalletExceeded.into());
    }

    // Transfer SOL from contributor to contribution vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.contributor.to_account_info(),
                to: ctx.accounts.contribution_vault.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update buyer account
    if buyer_account.buyer == Pubkey::default() {
        buyer_account.buyer = ctx.accounts.contributor.key();
        buyer_account.whitelisted = false; // Fair launch doesn't use whitelist
        launch_pad_account.buyers.push(ctx.accounts.contributor.key());
    }
    buyer_account.amount = buyer_account.amount.checked_add(amount).unwrap();

    // Update fair launch data
    fair_launch_data.total_raised = fair_launch_data.total_raised.checked_add(amount).unwrap();

    msg!("Contribution successful!");
    msg!("Contributor: {}", ctx.accounts.contributor.key());
    msg!("Amount contributed: {}", amount);
    msg!("Total contribution by user: {}", buyer_account.amount);
    msg!("Total raised: {}", fair_launch_data.total_raised);

    Ok(())
} 