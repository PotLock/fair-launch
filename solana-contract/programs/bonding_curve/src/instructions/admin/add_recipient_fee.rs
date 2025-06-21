use crate::errors::CommonCustomError;
use crate::state::{CurveConfiguration, CurveConfigurationAccount, Recipient};
use anchor_lang::prelude::*;

pub fn add_fee_recipients(ctx: Context<AddFeeRecipient>, recipients: Vec<Recipient>) -> Result<()> {
    msg!("Trying to add fee recipient");

    let bonding_curve_configuration = &mut ctx.accounts.bonding_curve_configuration;

    bonding_curve_configuration.add_fee_recipients(recipients)?;
    Ok(())
}

#[derive(Accounts)]
pub struct AddFeeRecipient<'info> {
    #[account(mut, has_one = fee_admin @ CommonCustomError::InvalidAuthority)]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub fee_admin: Signer<'info>,
}
