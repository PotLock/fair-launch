use anchor_lang::prelude::*;
use crate::{
    state::{LaunchPadAccount, WhitelistLaunchData, LaunchType}, 
    consts::{LAUNCHPAD_SEED_PREFIX, WHITELIST_DATA_SEED_PREFIX},
    errors::LaunchPadCustomErrror
};

#[derive(Accounts)]
pub struct UnpauseLaunchPad<'info> {
    #[account(
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump = launch_pad_account.bump,
        constraint = launch_pad_account.launch_type == LaunchType::Whitelist @ LaunchPadCustomErrror::InvalidLaunchType
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
}

pub fn unpause_launchpad(ctx: Context<UnpauseLaunchPad>) -> Result<()> {
    let whitelist_data = &mut ctx.accounts.whitelist_data;
    whitelist_data.paused = false;
    msg!("Whitelist launchpad unpaused");
    Ok(())
}

