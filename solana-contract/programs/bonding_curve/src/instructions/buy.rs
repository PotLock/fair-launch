use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken
};
use anchor_lang::system_program;

use anchor_spl::token_interface::{Mint, TokenInterface, TokenAccount};



use crate::consts::*;
use crate::errors::CustomError;
use crate::state::{BondingCurve, BondingCurveAccount, CurveConfiguration};

pub fn buy<'info>(ctx: Context<'_, '_, '_, 'info, Buy<'info>>, amount: u64) -> Result<()> {
    msg!("Trying to buy from the pool");
    // TODO: Implement buy function
    let bonding_curve = &mut ctx.accounts.bonding_curve_account;
    let bonding_curve_configuration = &mut ctx.accounts.bonding_curve_configuration;
    
    let user = &ctx.accounts.user;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let pool_sol_vault = &mut ctx.accounts.pool_sol_vault;

    let bonding_curve_type: u8 = bonding_curve_configuration.bonding_curve_type.into();
    let fee_percentage: u16 = bonding_curve_configuration.fee_percentage;
    let token_one_accounts = (
        &mut *ctx.accounts.token_mint,
        &mut *ctx.accounts.pool_token_account,
        &mut *ctx.accounts.user_token_account,
    );

    bonding_curve.buy(
        bonding_curve_configuration,
        token_one_accounts,
        pool_sol_vault,
        amount,
        fee_percentage,
        user,
        bonding_curve_type,
        bonding_curve.reserve_ratio,
        bonding_curve_configuration.target_liquidity,
        token_program,
        system_program,
    )?;

    // transfer fees to recipients
    for recipient in ctx.remaining_accounts {

        // check if recipient is a valid address in the fee recipients
        if !bonding_curve_configuration.fee_recipients.iter().any(|r| r.address == recipient.clone().key()) {
            return Err(CustomError::FeeRecipientNotFound.into());
        }


        let amount_each_gets = bonding_curve_configuration.fee_recipients.iter().find(|r| r.address == recipient.clone().key()).unwrap().amount;
        msg!("amount each gets {:?}", amount_each_gets);
        let cpi_accounts = system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: recipient.to_account_info(),
        };
        let cpi_program = system_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        let res = system_program::transfer(cpi_context, amount_each_gets);
        if !res.is_ok() {
            return Err(CustomError::TransferFailed.into());
        }
        msg!("transferred fees to recipient {:?}", recipient);
        msg!("amount each gets {:?}", amount_each_gets);
    }


    Ok(())
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(
        mut,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes()],
        bump,
    )]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump = bonding_curve_account.bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    #[account(mut)]
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut,
        associated_token::token_program = token_program,
        associated_token::mint = token_mint,
        associated_token::authority = bonding_curve_account,
    )]
    pub pool_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [SOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: AccountInfo<'info>,


    #[account(mut, 
        associated_token::mint = token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
