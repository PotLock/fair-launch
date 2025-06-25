use crate::consts::{
    CURVE_CONFIGURATION_SEED, METEORA_PROGRAM_KEY, POOL_SEED_PREFIX, PUMP_SWAP_PROGRAM_KEY,
    QUOTE_TOKEN_MINT, SOL_VAULT_PREFIX,
};
use crate::errors::CommonCustomError;
use crate::state::{get_meteora_pool_create_ix_data, get_pump_pool_create_ix_data};
use crate::state::{BondingCurve, CurveConfiguration};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::token_interface::{Mint as MintInterface, Token2022, TokenInterface};
use std::str::FromStr;
#[derive(Accounts)]
pub struct InitializeMeteoraPool<'info> {
    /// BEGINNING OF FAIRLAUNCH'S ACCOUNT

    #[account(
        mut,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes(), dex_configuration_account.global_admin.key().as_ref()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = bonding_curve_account
    )]
    pub pool_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [SOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: AccountInfo<'info>,

    /// END OF FAIRLAUNCH'S ACCOUNT

    /// BEGINNING OF METERORA'S ACCOUNT
    #[account(mut)]
    /// CHECK: Pool account (PDA address)
    pub pool: UncheckedAccount<'info>,

    /// CHECK: Config for fee
    pub config: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: lp mint
    pub lp_mint: UncheckedAccount<'info>,

    /// CHECK: Token A mint
    pub token_a_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub token_b_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Vault accounts for token A
    pub a_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Vault accounts for token B
    pub b_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Vault LP accounts and mints
    pub a_token_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Vault LP accounts and mints for token B
    pub b_token_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Vault LP accounts and mints for token A
    pub a_vault_lp_mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Vault LP accounts and mints for token B
    pub b_vault_lp_mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Token A LP
    pub a_vault_lp: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Token A LP
    pub b_vault_lp: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Accounts to bootstrap the pool with initial liquidity
    pub payer_token_a: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Accounts to bootstrap the pool with initial liquidity
    pub payer_token_b: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Accounts to bootstrap the pool with initial liquidity
    pub payer_pool_lp: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Protocol fee token a accounts
    pub protocol_token_a_fee: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Protocol fee token b accounts
    pub protocol_token_b_fee: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Additional program accounts
    pub rent: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: LP mint metadata PDA. Metaplex do the checking.
    pub mint_metadata: UncheckedAccount<'info>,

    /// CHECK: Metadata program account
    pub metadata_program: UncheckedAccount<'info>,

    /// CHECK: Vault program account
    pub vault_program: UncheckedAccount<'info>,
    /// CHECK: Token program account
    pub token_program: Program<'info, Token>,
    /// CHECK: Associated token program account
    pub associated_token_program: UncheckedAccount<'info>,
    /// CHECK: System program account
    pub system_program: Program<'info, System>,

    #[account(mut)]
    /// CHECK: Meteora Program
    pub meteora_program: AccountInfo<'info>,
}

pub fn initialize_pool_meteora_with_config(ctx: Context<InitializeMeteoraPool>) -> Result<()> {
    // todo
    // 1. check bonding curve liquidity hit the target liquidity if yes then create the pool ( locked_liquidity = true)
    // if bonding_curve_configuration.locked_liquidity == true && bonding_curve.reserve_balance == bonding_curve_configuration.target_liquidity {
    //     return err!(CommonCustomError::TargetLiquidityReached);
    // }
    // 2. update the bonding curve state to indicate that the pool has been created
    // 2.1

    let quote_mint: Pubkey = Pubkey::from_str(QUOTE_TOKEN_MINT).unwrap();

    require!(
        ctx.accounts.bonding_curve_account.token == ctx.accounts.token_b_mint.key(),
        CommonCustomError::BondingCurveTokenMismatch
    );

    require!(
        quote_mint.key() == ctx.accounts.token_a_mint.key(),
        CommonCustomError::SOLMismatch
    );

    // TODO!: make sure payer is authority

    let meteora_program_id: Pubkey = Pubkey::from_str(METEORA_PROGRAM_KEY).unwrap();

    // transfer token from pool to payer token b

    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_token_account.to_account_info(),
        to: ctx.accounts.payer_token_b.to_account_info(),
        authority: ctx.accounts.bonding_curve_account.to_account_info(),
    };

    let signer = BondingCurve::get_signer(
        &ctx.bumps.bonding_curve_account,
        ctx.accounts.token_b_mint.to_account_info().key,
    );

    let signer_seeds = &[&signer[..]];

    let token_b_amount = *&ctx.accounts.bonding_curve_account.reserve_token;

    msg!("Start transfer token");

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        ),
        token_b_amount,
    )?;

    msg!("Transfer token success");

    msg!("Start wrap solana token");

    let token_a_amount = *&ctx.accounts.bonding_curve_account.reserve_balance;

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_sol_vault.to_account_info(),
                to: ctx.accounts.payer_token_a.to_account_info(),
            },
            &[&[
                SOL_VAULT_PREFIX.as_bytes(),
                ctx.accounts.token_b_mint.key().as_ref(),
                &[ctx.bumps.pool_sol_vault],
            ]],
        ),
        token_a_amount,
    )?;

    let cpi_accounts = token::SyncNative {
        account: ctx.accounts.payer_token_a.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::sync_native(cpi_ctx)?;

    msg!("Wrap solana token success");

    msg!("Start meteora");

    let mut accounts = vec![
        AccountMeta::new(ctx.accounts.pool.key(), false),
        AccountMeta::new_readonly(ctx.accounts.config.key(), false),
        AccountMeta::new(ctx.accounts.lp_mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_a_mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_b_mint.key(), false),
        AccountMeta::new(ctx.accounts.a_vault.key(), false),
        AccountMeta::new(ctx.accounts.b_vault.key(), false),
        AccountMeta::new(ctx.accounts.a_token_vault.key(), false),
        AccountMeta::new(ctx.accounts.b_token_vault.key(), false),
        AccountMeta::new(ctx.accounts.a_vault_lp_mint.key(), false),
        AccountMeta::new(ctx.accounts.b_vault_lp_mint.key(), false),
        AccountMeta::new(ctx.accounts.a_vault_lp.key(), false),
        AccountMeta::new(ctx.accounts.b_vault_lp.key(), false),
        AccountMeta::new(ctx.accounts.payer_token_a.key(), false),
        AccountMeta::new(ctx.accounts.payer_token_b.key(), false),
        AccountMeta::new(ctx.accounts.payer_pool_lp.key(), false),
        AccountMeta::new(ctx.accounts.protocol_token_a_fee.key(), false),
        AccountMeta::new(ctx.accounts.protocol_token_b_fee.key(), false),
        AccountMeta::new(ctx.accounts.payer.key(), true),
        AccountMeta::new_readonly(ctx.accounts.rent.key(), false),
        AccountMeta::new(ctx.accounts.mint_metadata.key(), false),
        AccountMeta::new_readonly(ctx.accounts.metadata_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.vault_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.associated_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
    ];

    accounts.extend(ctx.remaining_accounts.iter().map(|acc| AccountMeta {
        pubkey: *acc.key,
        is_signer: false,
        is_writable: true,
    }));

    let data = get_meteora_pool_create_ix_data(token_a_amount, token_b_amount);

    let instruction = Instruction {
        program_id: meteora_program_id,
        accounts,
        data,
    };

    invoke_signed(
        &instruction,
        &[
            ctx.accounts.pool.to_account_info(),
            ctx.accounts.config.to_account_info(),
            ctx.accounts.lp_mint.to_account_info(),
            ctx.accounts.token_a_mint.to_account_info(),
            ctx.accounts.token_b_mint.to_account_info(),
            ctx.accounts.a_vault.to_account_info(),
            ctx.accounts.b_vault.to_account_info(),
            ctx.accounts.a_token_vault.to_account_info(),
            ctx.accounts.b_token_vault.to_account_info(),
            ctx.accounts.a_vault_lp_mint.to_account_info(),
            ctx.accounts.b_vault_lp_mint.to_account_info(),
            ctx.accounts.a_vault_lp.to_account_info(),
            ctx.accounts.b_vault_lp.to_account_info(),
            ctx.accounts.payer_token_a.to_account_info(),
            ctx.accounts.payer_token_b.to_account_info(),
            ctx.accounts.payer_pool_lp.to_account_info(),
            ctx.accounts.protocol_token_a_fee.to_account_info(),
            ctx.accounts.protocol_token_b_fee.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            ctx.accounts.mint_metadata.to_account_info(),
            ctx.accounts.metadata_program.to_account_info(),
            ctx.accounts.vault_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer_seeds,
    )?;

    // reset reserve token
    ctx.accounts.bonding_curve_account.reserve_token = 0;
    // reset reserve balance
    ctx.accounts.bonding_curve_account.reserve_balance = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(index: u16)]
pub struct InitializePumpswapPool<'info> {
    /// BEGINNING OF FAIRLAUNCH'S ACCOUNT

    #[account(
        mut,
        seeds = [CURVE_CONFIGURATION_SEED.as_bytes(), dex_configuration_account.global_admin.key().as_ref()],
        bump,
    )]
    pub dex_configuration_account: Box<Account<'info, CurveConfiguration>>,

    #[account(
        mut,
        seeds = [POOL_SEED_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve_account: Box<Account<'info, BondingCurve>>,

    pub token_mint: Box<InterfaceAccount<'info, MintInterface>>,
    /// CHECK:
    #[account(mut)]
    pub pool_token_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [SOL_VAULT_PREFIX.as_bytes(), token_mint.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: AccountInfo<'info>,

    /// END OF FAIRLAUNCH'S ACCOUNT

    /// BEGINNING OF PUMP SWAP'S ACCOUNT
    #[account(mut)]
    /// CHECK: Pool account (PDA address)
    pub pool: UncheckedAccount<'info>,

    /// CHECK: Config for fee
    pub global_config: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Base mint
    pub base_mint: UncheckedAccount<'info>,

    /// CHECK: Quote mint
    pub quote_mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: lp mint
    pub lp_mint: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: user base token account
    pub user_base_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: user quote token account
    pub user_quote_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: user pool token account
    pub user_pool_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: pool base token account
    pub pool_base_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: pool quote token account
    pub pool_quote_token_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// Check: token 2022 program
    pub token_2022_program: Program<'info, Token2022>,

    /// CHECK: Associated token program account
    pub associated_token_program: UncheckedAccount<'info>,

    /// CHECK: Token program account
    pub base_token_program: Interface<'info, TokenInterface>,

    /// CHECK: Quote token program account
    pub quote_token_program: Interface<'info, TokenInterface>,

    /// CHECK: Event authority
    pub event_authority: UncheckedAccount<'info>,

    /// CHECK: Pumpswap program
    pub pumpswap_program: AccountInfo<'info>,
}

pub fn initialize_pool_pumpswap(ctx: Context<InitializePumpswapPool>, index: u16) -> Result<()> {
    let quote_mint: Pubkey = Pubkey::from_str(QUOTE_TOKEN_MINT).unwrap();

    require!(
        ctx.accounts.bonding_curve_account.token == ctx.accounts.base_mint.key(),
        CommonCustomError::BondingCurveTokenMismatch
    );

    require!(
        quote_mint.key() == ctx.accounts.quote_mint.key(),
        CommonCustomError::SOLMismatch
    );

    // TODO!: make sure payer is authority

    let pumpswap_program_id: Pubkey = Pubkey::from_str(PUMP_SWAP_PROGRAM_KEY).unwrap();

    let cpi_accounts = anchor_spl::token_interface::TransferChecked {
        from: ctx.accounts.pool_token_account.to_account_info(),
        to: ctx.accounts.user_base_token_account.to_account_info(),
        mint: ctx.accounts.base_mint.to_account_info(),
        authority: ctx.accounts.bonding_curve_account.to_account_info(),
    };

    let signer = BondingCurve::get_signer(
        &ctx.bumps.bonding_curve_account,
        ctx.accounts.base_mint.to_account_info().key,
    );

    let signer_seeds = &[&signer[..]];

    let base_token_amount = *&ctx.accounts.bonding_curve_account.reserve_token;

    msg!("Start transfer token");

    anchor_spl::token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.base_token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        ),
        base_token_amount,
        //todo
        ctx.accounts.token_mint.decimals,
    )?;

    msg!("Transfer token success");

    msg!("Start wrap solana token");

    let quote_token_amount = *&ctx.accounts.bonding_curve_account.reserve_balance;

    //todo
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_sol_vault.to_account_info(),
                to: ctx.accounts.user_quote_token_account.to_account_info(),
            },
            &[&[
                SOL_VAULT_PREFIX.as_bytes(),
                ctx.accounts.base_mint.key().as_ref(),
                &[ctx.bumps.pool_sol_vault],
            ]],
        ),
        quote_token_amount,
    )?;

    let cpi_accounts = token::SyncNative {
        account: ctx.accounts.user_quote_token_account.to_account_info(),
    };

    let cpi_program = ctx.accounts.quote_token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::sync_native(cpi_ctx)?;

    msg!("Wrap solana token success");

    msg!("Start pumpswap");

    let mut accounts = vec![
        AccountMeta::new(ctx.accounts.pool.key(), false),
        AccountMeta::new_readonly(ctx.accounts.global_config.key(), false),
        AccountMeta::new(ctx.accounts.creator.key(), true),
        AccountMeta::new_readonly(ctx.accounts.base_mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.quote_mint.key(), false),
        AccountMeta::new(ctx.accounts.lp_mint.key(), false),
        AccountMeta::new(ctx.accounts.user_base_token_account.key(), false),
        AccountMeta::new(ctx.accounts.user_quote_token_account.key(), false),
        AccountMeta::new(ctx.accounts.user_pool_token_account.key(), false),
        AccountMeta::new(ctx.accounts.pool_base_token_account.key(), false),
        AccountMeta::new(ctx.accounts.pool_quote_token_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_2022_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.base_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.quote_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.associated_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.event_authority.key(), false),
        AccountMeta::new_readonly(ctx.accounts.pumpswap_program.key(), false),
    ];

    accounts.extend(ctx.remaining_accounts.iter().map(|acc| AccountMeta {
        pubkey: *acc.key,
        is_signer: false,
        is_writable: true,
    }));

    let data = get_pump_pool_create_ix_data(
        index,
        base_token_amount,
        quote_token_amount,
        ctx.accounts.creator.key(),
    );
    let instruction = Instruction {
        program_id: pumpswap_program_id,
        accounts,
        data,
    };

    invoke_signed(
        &instruction,
        &[
            ctx.accounts.pool.to_account_info(),
            ctx.accounts.global_config.to_account_info(),
            ctx.accounts.lp_mint.to_account_info(),
            ctx.accounts.base_mint.to_account_info(),
            ctx.accounts.quote_mint.to_account_info(),
            ctx.accounts.user_base_token_account.to_account_info(),
            ctx.accounts.user_quote_token_account.to_account_info(),
            ctx.accounts.user_pool_token_account.to_account_info(),
            ctx.accounts.pool_base_token_account.to_account_info(),
            ctx.accounts.pool_quote_token_account.to_account_info(),
            ctx.accounts.creator.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_2022_program.to_account_info(),
            ctx.accounts.base_token_program.to_account_info(),
            ctx.accounts.quote_token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.event_authority.to_account_info(),
            ctx.accounts.pumpswap_program.to_account_info(),
        ],
        signer_seeds,
    )?;

    // reset reserve token
    ctx.accounts.bonding_curve_account.reserve_token = 0;
    // reset reserve balance
    ctx.accounts.bonding_curve_account.reserve_balance = 0;
    Ok(())
}
