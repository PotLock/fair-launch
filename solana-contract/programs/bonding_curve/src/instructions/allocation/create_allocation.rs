use anchor_lang::prelude::*;
use crate::state::allocation::{Allocation, Vesting};
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface}};


#[derive(Accounts)]
pub struct CreateAllocation<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 256 + 32 + 1 + 8 + 8 + 1 + 512, 
        seeds = [b"allocation", wallet.key().as_ref()],
        bump
    )]
    pub allocation: Account<'info, Allocation>,

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        token::token_program = token_program,
        associated_token::token_program = token_program,
        associated_token::mint = token_mint,
        associated_token::authority = allocation,
        payer = authority,
    )]
    pub allocation_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>, // Only admin/authority can create allocations
    /// CHECK: This is the recipient wallet
    pub wallet: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,


}

pub fn create_allocation(
    ctx: Context<CreateAllocation>,
    category: String,
    percentage: u8,
    total_tokens: u64,
    vesting: Option<Vesting>,
) -> Result<()> {
    let allocation = &mut ctx.accounts.allocation;
    allocation.category = category.clone();
    allocation.wallet = ctx.accounts.wallet.key();
    allocation.percentage = percentage;
    allocation.total_tokens = total_tokens;
    allocation.claimed_tokens = 0;
    allocation.vesting = vesting;
    allocation.bump = ctx.bumps.allocation;
    Ok(())
} 