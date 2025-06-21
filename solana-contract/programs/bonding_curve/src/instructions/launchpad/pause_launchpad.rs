use anchor_lang::prelude::*;
use crate::{
    state::{LaunchPadAccount, WhitelistLaunchData, FairLaunchData}, 
    consts::LAUNCHPAD_SEED_PREFIX,
    errors::LaunchPadCustomErrror
};

#[derive(Accounts)]
pub struct PauseLaunchPad<'info> {
    #[account(
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump = launch_pad_account.bump
    )]
    pub launch_pad_account: Account<'info, LaunchPadAccount>,
    
    #[account(mut)]
    pub whitelist_data: Option<Account<'info, WhitelistLaunchData>>,
    
    #[account(mut)]
    pub fair_launch_data: Option<Account<'info, FairLaunchData>>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn pause_launchpad(ctx: Context<PauseLaunchPad>) -> Result<()> {
    let mut paused_count = 0;

    // Pause whitelist if it exists
    if let Some(whitelist_data) = &mut ctx.accounts.whitelist_data {
        // Validate relationship
        if whitelist_data.launchpad != ctx.accounts.launch_pad_account.key() {
            return Err(LaunchPadCustomErrror::InvalidAccountRelationship.into());
        }
        whitelist_data.paused = true;
        paused_count += 1;
        msg!("Whitelist launch paused");
    }

    // Pause fair launch if it exists
    if let Some(fair_launch_data) = &mut ctx.accounts.fair_launch_data {
        // Validate relationship
        if fair_launch_data.launchpad != ctx.accounts.launch_pad_account.key() {
            return Err(LaunchPadCustomErrror::InvalidAccountRelationship.into());
        }
        fair_launch_data.paused = true;
        paused_count += 1;
        msg!("Fair launch paused");
    }

    // Ensure at least one launch type was paused
    if paused_count == 0 {
        return Err(LaunchPadCustomErrror::InvalidLaunchType.into());
    }

    msg!("Successfully paused {} launch type(s)", paused_count);
    Ok(())
}