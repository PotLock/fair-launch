use crate::{
    errors::CustomError,
    state::allocation::{Allocation, Vesting},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut, has_one = wallet,seeds = [b"allocation", wallet.key().as_ref()], bump)]
    pub allocation: Account<'info, Allocation>,
    /// CHECK: This is the recipient wallet
    #[account(mut)]
    pub wallet: Signer<'info>,
    #[account(mut)]
    pub allocation_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn claim_tokens(ctx: Context<ClaimTokens>, now: i64) -> Result<u64> {
    let allocation = &mut ctx.accounts.allocation;
    let claimable: u64;
    let total_tokens = allocation.total_tokens;
    if let Some(ref mut vesting) = allocation.vesting {
        // Cliff check
        if now < vesting.start_time + vesting.cliff_period {
            return Err(CustomError::CliffNotReached.into()); // Cliff not reached
        }
        // Linear vesting
        let elapsed = now.saturating_sub(vesting.start_time + vesting.cliff_period);
        let total_vesting_time = vesting.duration;

        let vested = if elapsed >= total_vesting_time {
            total_tokens
        } else {
            total_tokens
                .saturating_mul(elapsed as u64)
                .checked_div(total_vesting_time as u64)
                .unwrap_or(0)
        };
        claimable = vested.saturating_sub(vesting.released);
        vesting.released = vesting.released.saturating_add(claimable);
    } else {
        // No vesting, all tokens claimable
        claimable = allocation
            .total_tokens
            .saturating_sub(allocation.claimed_tokens);
        allocation.claimed_tokens = allocation.total_tokens;
    }
    allocation.claimed_tokens = allocation.claimed_tokens.saturating_add(claimable);

    // CPI: Transfer claimable tokens from allocation_vault to user_token_account
    if claimable > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token_interface::TransferChecked {
                    from: ctx.accounts.allocation_vault.to_account_info(),
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.allocation.to_account_info(),
                },
                &[&[
                    b"allocation",
                    ctx.accounts.wallet.key().as_ref(),
                    &[ctx.bumps.allocation],
                ]],
            ),
            claimable,
            ctx.accounts.token_mint.decimals,
        )?;
    }
    Ok(claimable)
}
