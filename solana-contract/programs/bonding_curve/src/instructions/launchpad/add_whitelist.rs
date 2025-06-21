use anchor_lang::prelude::*;
use crate::{errors::LaunchPadCustomErrror, state::{BuyerAccount, LaunchPadAccount, WhitelistLaunchData}, consts::{LAUNCHPAD_SEED_PREFIX, WHITELIST_DATA_SEED_PREFIX, BUYER_SEED_PREFIX}};

#[derive(Accounts)]
pub struct AddWhitelist<'info> {
    #[account(
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump = launch_pad_account.bump,
        constraint = launch_pad_account.launch_type == crate::state::LaunchType::Whitelist @ LaunchPadCustomErrror::InvalidLaunchType
    )]
    pub launch_pad_account: Account<'info, LaunchPadAccount>,
    
    #[account(
        mut,
        seeds = [WHITELIST_DATA_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump = whitelist_data.bump,
        constraint = whitelist_data.launchpad == launch_pad_account.key() @ LaunchPadCustomErrror::InvalidAccountRelationship
    )]
    pub whitelist_data: Account<'info, WhitelistLaunchData>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init_if_needed,
        seeds = [BUYER_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref(), user.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + BuyerAccount::ACCOUNT_SIZE,
    )]
    pub buyer_account: Account<'info, BuyerAccount>,
    
    /// CHECK: User to be whitelisted
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn add_whitelist(ctx: Context<AddWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist_data = &mut ctx.accounts.whitelist_data;
    let buyer_account = &mut ctx.accounts.buyer_account;

    // Check if whitelist duration is not over
    let current_time = Clock::get()?.unix_timestamp;
    msg!("Current time: {}", current_time);
    msg!("Whitelist duration ends at: {}", whitelist_data.whitelist_duration);
    
    if current_time > whitelist_data.whitelist_duration {
        return Err(LaunchPadCustomErrror::WhitelistDurationOver.into());
    }
    
    // Check if launchpad is not paused
    if whitelist_data.paused {
        return Err(LaunchPadCustomErrror::LaunchpadPaused.into());
    }

    // Initialize buyer account
    buyer_account.buyer = user;
    buyer_account.amount = 0;
    buyer_account.whitelisted = true;
    buyer_account.launchpad = ctx.accounts.launch_pad_account.key();
    buyer_account.bump = ctx.bumps.buyer_account;

    // Add user to whitelist if not already present
    if !whitelist_data.whitelisted_users.contains(&user) {
        whitelist_data.whitelisted_users.push(user);
        msg!("User {} added to whitelist", user);
    } else {
        msg!("User {} is already whitelisted", user);
    }

    Ok(())
}

