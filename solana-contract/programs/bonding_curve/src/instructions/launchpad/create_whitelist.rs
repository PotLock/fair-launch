use anchor_lang::prelude::*;
use crate::{consts::{CURVE_CONFIGURATION_SEED, LAUNCHPAD_SEED_PREFIX}, state::{CurveConfiguration, LaunchPadAccount}};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::errors::CustomError;

#[derive(Accounts)]
pub struct CreateWhitelistLaunch<'info> {
    #[account(
        init, 
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump,
        payer = authority, 
        space = 8 + std::mem::size_of::<LaunchPadAccount>() + LaunchPadAccount::ACCOUNT_SIZE,
    )]
    pub launch_pad_account: Box<Account<'info, LaunchPadAccount>>,
    #[account(
        mint::token_program = token_program
    )]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        token::token_program = token_program,
        associated_token::token_program = token_program,
        associated_token::mint = token_mint,
        associated_token::authority = launch_pad_account,
        payer = authority,
    )]
    pub launchpad_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn create_whitelist_launch(ctx: Context<CreateWhitelistLaunch>, token_price: u64, purchase_limit_per_wallet: u64, whitelist_duration: i64, start_time: i64, end_time: i64) -> Result<()> {
    let launch_pad_account = &mut ctx.accounts.launch_pad_account;

    let (_, bump) = Pubkey::find_program_address(&[LAUNCHPAD_SEED_PREFIX.as_bytes(), ctx.accounts.authority.key().as_ref()], ctx.program_id);
    let current_time = Clock::get()?.unix_timestamp;
    msg!("current time: {}", current_time);
    // make sure current time is between start and end time
    if current_time > start_time || current_time > end_time {
        return Err(CustomError::InvalidTimeRange.into());
    }

    let whitelist_duration = current_time.checked_add(whitelist_duration).ok_or(CustomError::OverFlowUnderFlowOccured)?;

    launch_pad_account.set_inner(LaunchPadAccount::new(
        ctx.accounts.authority.key(),
        ctx.accounts.token_mint.key(),
        ctx.accounts.launchpad_vault.key(),
        token_price,
        purchase_limit_per_wallet,
        whitelist_duration,
        start_time,
        end_time,
        bump,
    ));
    Ok(())
}
