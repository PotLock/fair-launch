use crate::errors::CommonCustomError;
use crate::state::{CurveConfiguration, CurveConfigurationAccount, Recipient};
use anchor_lang::prelude::*;

pub fn change_fee_admin(ctx: Context<ChangeFeeAdmin>, new_fee_admin: Pubkey) -> Result<()> {
    msg!("Trying to add fee recipient");

    let bonding_curve_configuration = &mut ctx.accounts.bonding_curve_configuration;

    bonding_curve_configuration.change_fee_admin(new_fee_admin)?;
    Ok(())
}

#[derive(Accounts)]
pub struct ChangeFeeAdmin<'info> {
    #[account(mut, has_one = fee_admin @ CommonCustomError::InvalidAuthority)]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub fee_admin: Signer<'info>,
}


