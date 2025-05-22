use crate::consts::*;
use crate::state::*;
use anchor_lang::prelude::*;



#[derive(Accounts, Clone)]
pub struct InitializeBondingCurve<'info> {
    #[account(
        init,
        space = CurveConfiguration::ACCOUNT_SIZE,
        payer = admin,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes()],
        bump,
    )]
    pub bonding_curve_configuration: Box<Account<'info, CurveConfiguration>>,


    #[account(mut)]
    pub admin: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<InitializeBondingCurve>,
    admin: Pubkey,
    fee_percentage: u16,
    initial_quorum: u64,
    target_liquidity: u64,
    governance: Pubkey,
    dao_quorum: u16,
    bonding_curve_type: u8,
    max_token_supply: u64,
    liquidity_lock_period: i64,
    liquidity_pool_percentage: u16,
    initial_price: u64,
    initial_supply: u64,
    fee_recipients: Vec<Recipient>,
) -> Result<()> {
    let dex_config = &mut ctx.accounts.bonding_curve_configuration;
    let current_time = Clock::get()?.unix_timestamp;
    let liquidity_lock_period = current_time + liquidity_lock_period;

    dex_config.set_inner(CurveConfiguration::new(
        admin,
        initial_quorum,
        fee_percentage,
        target_liquidity,
        governance,
        dao_quorum,
        bonding_curve_type,
        max_token_supply,
        liquidity_lock_period,
        liquidity_pool_percentage,
        initial_price,
        initial_supply,
        fee_recipients,
    )?);


    Ok(())
}
