
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::consts::*;
use crate::errors::CustomError;
use crate::state::{CurveConfiguration, Recipient, CurveConfigurationAccount};

pub fn add_fee_recipients(ctx: Context<AddFeeRecipient>, recipients: Vec<Recipient>) -> Result<()> {
    msg!("Trying to add fee recipient");

    let bonding_curve_configuration = &mut ctx.accounts.bonding_curve_configuration;

    bonding_curve_configuration.add_fee_recipients(recipients)?;
    Ok(())
}




#[derive(Accounts)]
pub struct AddFeeRecipient<'info> {

    #[account(mut, has_one = admin @ CustomError::InvalidAuthority)]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,


    #[account(mut)]
    pub admin: Signer<'info>,
}


