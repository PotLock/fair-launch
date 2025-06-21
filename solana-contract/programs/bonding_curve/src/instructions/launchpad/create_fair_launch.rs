use anchor_lang::prelude::*;
use crate::{consts::{LAUNCHPAD_SEED_PREFIX, FAIR_LAUNCH_DATA_SEED_PREFIX}, state::{LaunchPadAccount, FairLaunchData}, errors::{LaunchPadCustomErrror, CommonCustomError}};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct CreateFairLaunch<'info> {
    #[account(
        init, 
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump,
        payer = authority, 
        space = 8 + std::mem::size_of::<LaunchPadAccount>() + LaunchPadAccount::ACCOUNT_SIZE,
    )]
    pub launch_pad_account: Box<Account<'info, LaunchPadAccount>>,
    
    #[account(
        init,
        seeds = [FAIR_LAUNCH_DATA_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + std::mem::size_of::<FairLaunchData>() + FairLaunchData::ACCOUNT_SIZE,
    )]
    pub fair_launch_data: Box<Account<'info, FairLaunchData>>,
    
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

pub fn create_fair_launch(
    ctx: Context<CreateFairLaunch>, 
    token_price: u64,
    soft_cap: u64,
    hard_cap: u64,
    start_time: i64,
    end_time: i64,
    min_contribution: u64,
    max_contribution: u64,
    max_tokens_per_wallet: u64,
    distribution_delay: i64,
) -> Result<()> {
    let launch_pad_account = &mut ctx.accounts.launch_pad_account;
    let fair_launch_data = &mut ctx.accounts.fair_launch_data;

    let current_time = Clock::get()?.unix_timestamp;
    
    // Validate time ranges
    if start_time <= current_time {
        return Err(LaunchPadCustomErrror::InvalidTimeRange.into());
    }
    
    if end_time <= start_time {
        return Err(LaunchPadCustomErrror::InvalidTimeRange.into());
    }
    
    // Validate caps
    if hard_cap <= soft_cap {
        return Err(CommonCustomError::InvalidAmount.into());
    }
    
    // Validate contribution limits
    if max_contribution <= min_contribution {
        return Err(CommonCustomError::InvalidAmount.into());
    }
    
    // Validate token price
    if token_price == 0 {
        return Err(CommonCustomError::InvalidAmount.into());
    }

    // Initialize LaunchPadAccount for fair launch
    launch_pad_account.set_inner(LaunchPadAccount::new_fair_launch(
        ctx.accounts.authority.key(),
        ctx.accounts.token_mint.key(),
        ctx.accounts.launchpad_vault.key(),
        token_price,
        start_time,
        end_time,
        fair_launch_data.key(),
        ctx.bumps.launch_pad_account,
    ));

    // Initialize FairLaunchData
    fair_launch_data.set_inner(FairLaunchData::new(
        ctx.accounts.launch_pad_account.key(),
        soft_cap,
        hard_cap,
        min_contribution,
        max_contribution,
        max_tokens_per_wallet,
        distribution_delay,
        ctx.bumps.fair_launch_data,
    ));

    msg!("Fair launch created successfully");
    msg!("Soft cap: {}", soft_cap);
    msg!("Hard cap: {}", hard_cap);
    msg!("Token price: {}", token_price);
    msg!("Start time: {}", start_time);
    msg!("End time: {}", end_time);

    Ok(())
} 