use crate::consts::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(index: u16)]
pub struct InitializeBondingCurve<'info> {
    #[account(
        init,
        space = CurveConfiguration::ACCOUNT_SIZE,
        payer = owner,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes(), &index.to_le_bytes()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}   

pub fn initialize(
    ctx: Context<InitializeBondingCurve>,
    index: u16,
    fee_percentage: u16,
    initial_quorum: u64,
    target_liquidity: u64,
    governance: Pubkey,
    dao_quorum: u16,
    bonding_curve_type: u8,
    max_token_supply: u64,
    liquidity_lock_period: i64,
    liquidity_pool_percentage: u16,
    fee_recipients: Vec<Recipient>,
) -> Result<()> {
    let dex_config = &mut ctx.accounts.dex_configuration_account;
    let current_time = Clock::get()?.unix_timestamp;
    let liquidity_lock_period = current_time + liquidity_lock_period;

    dex_config.set_inner(CurveConfiguration::new(
        index,
        initial_quorum,
        fee_percentage,
        target_liquidity,
        governance,
        dao_quorum,
        bonding_curve_type,
        max_token_supply,
        liquidity_lock_period,
        liquidity_pool_percentage,
    ));

    fee_pool_account.set_inner(FeePool::new(fee_recipients, ctx.bumps.fee_pool_account)?);

    Ok(())
}
