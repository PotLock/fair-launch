use anchor_lang::prelude::*;
use crate::{errors::CustomError, state::{BuyerAccount, LaunchPadAccount}};

#[derive(Accounts)]
pub struct AddWhitelist<'info> {
    #[account(
        mut,
        seeds = [b"launchpad".as_ref(), authority.key().as_ref()],
        bump = launch_pad_account.bump
    )]
    pub launch_pad_account: Account<'info, LaunchPadAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [b"buyer", launch_pad_account.key().as_ref(), user.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + std::mem::size_of::<BuyerAccount>(),
    )]
    pub buyer_account: Account<'info, BuyerAccount>,
    /// CHECK:
    pub user: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn add_whitelist(ctx: Context<AddWhitelist>, user: Pubkey) -> Result<()> {
    let launch_pad_account = &mut ctx.accounts.launch_pad_account;
    let buyer_account = &mut ctx.accounts.buyer_account;

    // check whitelist duration is not over
    let current_time = Clock::get()?.unix_timestamp;
    msg!("whitelist duration: {}", launch_pad_account.whitelist_duration);
    if current_time > launch_pad_account.whitelist_duration {
        return Err(CustomError::WhitelistDurationOver.into());
    }

    buyer_account.buyer = user;
    buyer_account.amount = 0;
    buyer_account.whitelisted = true;

    launch_pad_account.whitelisted_users.push(buyer_account.buyer.key());
    Ok(())
}

