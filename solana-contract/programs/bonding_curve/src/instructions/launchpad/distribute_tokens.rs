use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked};
use crate::{
    consts::{LAUNCHPAD_SEED_PREFIX, FAIR_LAUNCH_DATA_SEED_PREFIX, BUYER_SEED_PREFIX}, 
    state::{LaunchPadAccount, FairLaunchData, BuyerAccount, LaunchType}, 
    errors::{CommonCustomError, LaunchPadCustomErrror}
};

#[derive(Accounts)]
pub struct DistributeTokens<'info> {
    #[account(
        seeds = [LAUNCHPAD_SEED_PREFIX.as_bytes(), launch_pad_account.authority.key().as_ref()],
        bump = launch_pad_account.bump,
        constraint = launch_pad_account.launch_type == LaunchType::FairLaunch @ LaunchPadCustomErrror::InvalidLaunchType,
    )]
    pub launch_pad_account: Box<Account<'info, LaunchPadAccount>>,
    
    #[account(
        seeds = [FAIR_LAUNCH_DATA_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref()],
        bump = fair_launch_data.bump,
        constraint = fair_launch_data.launchpad == launch_pad_account.key() @ LaunchPadCustomErrror::InvalidAccountRelationship,
    )]
    pub fair_launch_data: Box<Account<'info, FairLaunchData>>,
    
    #[account(
        mut,
        seeds = [BUYER_SEED_PREFIX.as_bytes(), launch_pad_account.key().as_ref(), recipient.key().as_ref()],
        bump = buyer_account.bump,
        constraint = buyer_account.buyer == recipient.key() @ CommonCustomError::InvalidAuthority,
    )]
    pub buyer_account: Box<Account<'info, BuyerAccount>>,
    
    #[account(
        mint::token_program = token_program,
        constraint = token_mint.key() == launch_pad_account.token_mint @ CommonCustomError::BondingCurveTokenMismatch,
    )]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    
    #[account(
        mut,
        token::token_program = token_program,
        token::mint = token_mint,
        token::authority = launch_pad_account,
        constraint = launchpad_vault.key() == launch_pad_account.vault @ CommonCustomError::InvalidAuthority,
    )]
    pub launchpad_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        token::token_program = token_program,
        token::mint = token_mint,
        token::authority = recipient,
    )]
    pub recipient_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn distribute_tokens(ctx: Context<DistributeTokens>) -> Result<()> {
    let launch_pad_account = &ctx.accounts.launch_pad_account;
    let fair_launch_data = &ctx.accounts.fair_launch_data;
    let buyer_account = &mut ctx.accounts.buyer_account;
    let current_time = Clock::get()?.unix_timestamp;

    // Check if sale has ended
    if current_time <= launch_pad_account.end_time {
        return Err(LaunchPadCustomErrror::SaleNotStarted.into()); // Reusing error, could create SaleNotEnded
    }

    // Check if soft cap was reached
    if fair_launch_data.total_raised < fair_launch_data.soft_cap {
        return Err(LaunchPadCustomErrror::SoftCapNotReached.into());
    }

    // Check distribution delay
    let distribution_time = launch_pad_account.end_time + (fair_launch_data.distribution_delay * 3600); // Convert hours to seconds
    if current_time < distribution_time {
        return Err(LaunchPadCustomErrror::DistributionDelayNotReached.into());
    }

    // Check if tokens already distributed to this buyer
    if buyer_account.amount == 0 {
        return Err(CommonCustomError::InvalidAmount.into());
    }

    // Calculate tokens to distribute based on proportional contribution
    // In fair launch, tokens are distributed proportionally based on contribution percentage
    let total_tokens_available = ctx.accounts.launchpad_vault.amount;
    
    let tokens_to_distribute = buyer_account.amount
        .checked_mul(total_tokens_available)
        .ok_or(CommonCustomError::OverFlowUnderFlowOccured)?
        .checked_div(fair_launch_data.total_raised)
        .ok_or(CommonCustomError::OverFlowUnderFlowOccured)?;

    // Ensure we don't exceed max tokens per wallet
    if tokens_to_distribute > fair_launch_data.max_tokens_per_wallet {
        return Err(LaunchPadCustomErrror::MaxTokensPerWalletExceeded.into());
    }

    // Transfer tokens from launchpad vault to recipient
    let authority_seeds = &[
        LAUNCHPAD_SEED_PREFIX.as_bytes(),
        launch_pad_account.authority.as_ref(),
        &[launch_pad_account.bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.launchpad_vault.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: launch_pad_account.to_account_info(),
            },
            signer_seeds,
        ),
        tokens_to_distribute,
        ctx.accounts.token_mint.decimals,
    )?;

    // Mark buyer as processed by setting amount to 0
    buyer_account.amount = 0;

    msg!("Tokens distributed successfully!");
    msg!("Recipient: {}", ctx.accounts.recipient.key());
    msg!("Tokens distributed: {}", tokens_to_distribute);
    msg!("Contribution percentage: {}%", (buyer_account.amount * 100) / fair_launch_data.total_raised);

    Ok(())
} 