use anchor_lang::prelude::*;
use crate::{state::LaunchPadAccount, consts::LAUNCHPAD_SEED_PREFIX};

#[derive(Accounts)]
pub struct PauseLaunchPad<'info> {
    #[account(
        mut,
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump = launch_pad_account.bump
    )]
    pub launch_pad_account: Account<'info, LaunchPadAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn pause_launchpad(ctx: Context<PauseLaunchPad>) -> Result<()> {
    let launch_pad_account = &mut ctx.accounts.launch_pad_account;
    launch_pad_account.paused = true;
    Ok(())
}