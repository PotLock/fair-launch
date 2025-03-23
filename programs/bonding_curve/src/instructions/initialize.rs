use crate::consts::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(Accounts, Clone)]
pub struct InitializeBondingCurve<'info> {
    #[account(
        init,
        space = CurveConfiguration::ACCOUNT_SIZE,
        payer = admin,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes(), token_mint.key().as_ref(), admin.key().as_ref()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        space = 8+ 3000,
        payer = admin,
        seeds = [FEE_POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub fee_pool_account: Box<Account<'info, FeePool>>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<InitializeBondingCurve>,
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
    let fee_pool_account = &mut ctx.accounts.fee_pool_account;
    let current_time = Clock::get()?.unix_timestamp;
    let liquidity_lock_period = current_time + liquidity_lock_period;

    dex_config.set_inner(CurveConfiguration::new(
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
