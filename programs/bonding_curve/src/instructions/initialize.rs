use crate::{errors::CustomError, state::*};
use anchor_lang::prelude::*;

use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::consts::*;


#[derive(Accounts, Clone)]
pub struct InitializeBondingCurve<'info> {
    #[account(
        init,
        // todo: Calculate correct space for optimizing 
        space = 8+ 3000,
        payer = admin,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}




pub fn initialize(
    ctx: Context<InitializeBondingCurve>,
    fees: f64,
    fee_recipient: Pubkey,
    initial_quorum: u64,

) -> Result<()> {
    let dex_config = &mut ctx.accounts.dex_configuration_account;

    if fees < 0_f64 || fees > 100_f64 {
        return err!(CustomError::InvalidFee);
    }

    dex_config.set_inner(CurveConfiguration::new(fees, fee_recipient, initial_quorum));

    Ok(())
}