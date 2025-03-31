use crate::consts::*;
use crate::errors::CustomError;
use crate::utils::calc::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BondingCurveType {
    Linear,
    Quadratic,
    // Polynomial,
}

impl TryFrom<u8> for BondingCurveType {
    type Error = anchor_lang::error::Error;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(BondingCurveType::Linear),
            1 => Ok(BondingCurveType::Quadratic),
            _ => Err(CustomError::InvalidBondingCurveType.into()),
        }
    }
}

impl From<BondingCurveType> for u8 {
    fn from(curve_type: BondingCurveType) -> Self {
        match curve_type {
            BondingCurveType::Linear => 0,
            BondingCurveType::Quadratic => 1,
        }
    }
}

/// CURVE CONFIGURATION ACCOUNT
#[account]
pub struct CurveConfiguration {
    pub initial_quorum: u64,
    pub use_dao: bool,
    pub governance: Pubkey,     // Shared governance contract address
    pub dao_quorum: u16,        // Minimum token quorum (in basis points) for DAO decisions
    pub locked_liquidity: bool, // Whether liquidity is locked
    pub target_liquidity: u64,  // Threshold to trigger liquidity addition
    pub fee_percentage: u16,    // Transaction fee in basis points (e.g., 200 = 2%)
    pub fees_enabled: bool,     // Toggle for enabling/disabling fees
    pub bonding_curve_type: BondingCurveType,
    pub max_token_supply: u64,
    pub liquidity_lock_period: i64, // Liquidity lock period in seconds. cant remove liquidity before this period
    pub liquidity_pool_percentage: u16, // Percentage of the bonding curve liquidity pool that is migrated to the DEX
}

impl CurveConfiguration {
    // Discriminator (8) + u64(8) + bool(1) + Pubkey(32) + u16(2) + bool(1) + u64(8) + u16(2) + bool(1) + u8(1) + u64(8) + i64(8) + u16(2)
    pub const ACCOUNT_SIZE: usize = 8 + 8 + 1 + 32 + 2 + 1 + 8 + 2 + 1 + 1 + 8 + 8 + 2;

    pub fn new(
        initial_quorum: u64,
        fee_percentage: u16,
        target_liquidity: u64,
        governance: Pubkey,
        dao_quorum: u16,
        bonding_curve_type: u8,
        max_token_supply: u64,
        liquidity_lock_period: i64,
        liquidity_pool_percentage: u16,
    ) -> Self {
        let bonding_curve_type =
            BondingCurveType::try_from(bonding_curve_type).unwrap_or(BondingCurveType::Linear);

        Self {
            initial_quorum,
            use_dao: false,
            governance,
            dao_quorum,
            locked_liquidity: false,
            target_liquidity,
            fee_percentage,
            fees_enabled: true,
            bonding_curve_type,
            max_token_supply,
            liquidity_lock_period,
            liquidity_pool_percentage,
        }
    }
}

pub trait CurveConfigurationAccount<'info> {
    fn toggle_dao(&mut self) -> Result<()>;
    fn update_fee_percentage(&mut self, new_fee_percentage: u16) -> Result<()>;
}

impl<'info> CurveConfigurationAccount<'info> for Account<'info, CurveConfiguration> {
    fn toggle_dao(&mut self) -> Result<()> {
        if self.use_dao {
            return err!(CustomError::DAOAlreadyActivated);
        }
        self.use_dao = true;
        Ok(())
    }

    fn update_fee_percentage(&mut self, new_fee_percentage: u16) -> Result<()> {
        // Maximum fee is 10%
        if new_fee_percentage <= 1000_u16 {
            return err!(CustomError::InvalidFee);
        }
        self.fee_percentage = new_fee_percentage;
        Ok(())
    }
}

/// BONDING CURVE ACCOUNT
#[account]
pub struct BondingCurve {
    pub creator: Pubkey,
    pub total_supply: u64,    // Tracks the total token supply
    pub reserve_balance: u64, // Tracks the SOL reserve balance
    pub reserve_token: u64,   // Tracks the token reserve balance
    pub token: Pubkey,        // Public key of the token in the liquidity pool
    pub reserve_ratio: u16,   // Reserve ratio in basis points (default: 50%)
    pub bump: u8,             // Bump seed for PDA
}

impl BondingCurve {
    // Discriminator (8) + Pubkey(32) + u64(8) + u64(8) + u64(8) + Pubkey(32) + u16(2) + u8(1)
    pub const ACCOUNT_SIZE: usize = 8 + 32 + 8 + 8 + 8 + 32 + 2 + 1;
    pub fn new(creator: Pubkey, token: Pubkey, bump: u8) -> Self {
        Self {
            creator,
            total_supply: 0,
            reserve_balance: 0,
            reserve_token: 0,
            token,
            reserve_ratio: 5000,
            bump,
        }
    }
}

pub trait BondingCurveAccount<'info> {
    fn calculate_buy_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64>;
    fn calculate_sell_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64>;

    // Allows adding liquidity by depositing an amount of two tokens and getting back pool shares
    fn add_liquidity(
        &mut self,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    // Allows removing liquidity by burning pool shares and receiving back a proportionate amount of tokens
    fn remove_liquidity(
        &mut self,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_account: &mut AccountInfo<'info>,
        authority: &Signer<'info>,
        bump: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn buy(
        &mut self,
        // bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        fee_pool_account: &mut Account<'info, FeePool>,
        fee_pool_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn sell(
        &mut self,
        // bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        fee_pool_account: &mut Account<'info, FeePool>,
        fee_pool_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        bump: u8,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn transfer_sol_to_pool(
        &self,
        from: &Signer<'info>,
        to: &mut AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn transfer_sol_from_pool(
        &self,
        from: &mut AccountInfo<'info>,
        to: &Signer<'info>,
        amount: u64,
        bump: u8,
        system_program: &Program<'info, System>,
        seed: &[u8],
    ) -> Result<()>;

    fn transfer_token_from_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;

    fn transfer_token_to_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;
}

impl<'info> BondingCurveAccount<'info> for Account<'info, BondingCurve> {
    fn calculate_buy_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64> {
        let bonding_curve_type = BondingCurveType::try_from(bonding_curve_type)
            .map_err(|_| CustomError::InvalidBondingCurveType)?;

        if bonding_curve_type == BondingCurveType::Linear {
            return linear_buy_cost(amount, self.reserve_ratio, self.total_supply);
        } else if bonding_curve_type == BondingCurveType::Quadratic {
            return quadratic_buy_cost(amount, self.reserve_ratio, self.total_supply);
        } else {
            return Err(CustomError::InvalidBondingCurveType.into());
        }
    }

    fn calculate_sell_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64> {
        let bonding_curve_type = BondingCurveType::try_from(bonding_curve_type)
            .map_err(|_| CustomError::InvalidBondingCurveType)?;

        if bonding_curve_type == BondingCurveType::Linear {
            return linear_sell_cost(amount, self.reserve_ratio, self.total_supply);
        } else if bonding_curve_type == BondingCurveType::Quadratic {
            return quadratic_sell_cost(amount, self.reserve_ratio, self.total_supply);
        } else {
            return Err(CustomError::InvalidBondingCurveType.into());
        }
    }

    fn buy(
        &mut self,
        // bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        fee_pool_account: &mut Account<'info, FeePool>,
        fee_pool_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        let amount_out = self.calculate_buy_cost(amount, bonding_curve_type)?;
        let fee = amount_out * (fee_percentage as u64) / 10000;

        msg!("amount_out {}", amount_out);

        // TODO: update bonding curve account
        self.total_supply += amount;
        self.reserve_balance += amount;
        self.reserve_token -= amount;
        self.transfer_sol_to_pool(authority, pool_sol_vault, amount, system_program)?;

        self.transfer_token_from_pool(
            token_accounts.1,
            token_accounts.2,
            amount_out,
            token_program,
        )?;
        // Collect fees
        fee_pool_account.calculate_fee(fee)?;
        // transfer fees to fee pool
        self.transfer_sol_to_pool(authority, fee_pool_vault, fee, system_program)?;

        Ok(())
    }

    fn sell(
        &mut self,
        // bonding_configuration_account: &Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        fee_pool_account: &mut Account<'info, FeePool>,
        fee_pool_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        bump: u8,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        let amount_out = self.calculate_sell_cost(amount, bonding_curve_type)?;
        let fee = amount_out * (fee_percentage as u64) / 10000;

        msg!("reward {}", amount_out);
        if self.reserve_balance < amount_out {
            return err!(CustomError::NotEnoughSolInVault);
        }

        self.total_supply -= amount;
        self.reserve_balance -= amount_out;
        self.reserve_token += amount;
        self.transfer_token_to_pool(
            token_accounts.2,
            token_accounts.1,
            amount as u64,
            authority,
            token_program,
        )?;
        msg!("pool_sol_vault {:?}", pool_sol_vault);
        self.transfer_sol_from_pool(
            pool_sol_vault,
            authority,
            amount_out,
            bump,
            system_program,
            SOL_VAULT_PREFIX.as_bytes(),
        )?;

        fee_pool_account.calculate_fee(fee)?;
        // transfer fees to fee pool
        self.transfer_sol_to_pool(authority, fee_pool_vault, fee, system_program)?;

        Ok(())
    }

    fn add_liquidity(
        &mut self,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),

        pool_sol_vault: &mut AccountInfo<'info>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        msg!("Adding liquidity to the pool");
        // Checking if the amount is greater than 0 and less than token balance
        let balance = token_accounts.2.amount;
        msg!("balance {}", balance);
        if amount == 0 || amount > balance {
            return err!(CustomError::InvalidAmount);
        }

        self.transfer_token_to_pool(
            token_accounts.2,
            token_accounts.1,
            amount,
            authority,
            token_program,
        )?;

        self.transfer_sol_to_pool(
            authority,
            pool_sol_vault,
            INITIAL_LAMPORTS_FOR_POOL,
            system_program,
        )?;
        self.reserve_token += amount;
        self.reserve_balance += INITIAL_LAMPORTS_FOR_POOL;

        Ok(())
    }

    // Allows removing liquidity by burning pool shares and receiving back a proportionate amount of tokens
    fn remove_liquidity(
        &mut self,
        token_accounts: (
            &mut Account<'info, Mint>,
            &mut Account<'info, TokenAccount>,
            &mut Account<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        authority: &Signer<'info>,
        bump: u8,
        token_program: &Program<'info, Token>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        self.transfer_token_from_pool(
            token_accounts.1,
            token_accounts.2,
            token_accounts.1.amount as u64,
            token_program,
        )?;
        let amount = pool_sol_vault.to_account_info().lamports() as u64;
        self.transfer_sol_from_pool(
            pool_sol_vault,
            authority,
            amount,
            bump,
            system_program,
            SOL_VAULT_PREFIX.as_bytes(),
        )?;
        Ok(())
    }

    fn transfer_sol_to_pool(
        &self,
        from: &Signer<'info>,
        to: &mut AccountInfo<'info>,
        amount: u64,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    fn transfer_sol_from_pool(
        &self,
        from: &mut AccountInfo<'info>,
        to: &Signer<'info>,
        amount: u64,
        bump: u8,
        system_program: &Program<'info, System>,
        seed: &[u8],
    ) -> Result<()> {
        system_program::transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: from.clone(),
                    to: to.to_account_info().clone(),
                },
                &[&[
                    // SOL_VAULT_PREFIX.as_bytes(),
                    seed,
                    self.token.key().as_ref(),
                    &[bump],
                ]],
            ),
            amount,
        )?;
        Ok(())
    }

    fn transfer_token_from_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                token::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: self.to_account_info(),
                },
                &[&[
                    POOL_SEED_PREFIX.as_bytes(),
                    self.token.key().as_ref(),
                    &[self.bump],
                ]],
            ),
            amount,
        )?;
        Ok(())
    }

    fn transfer_token_to_pool(
        &self,
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                token::Transfer {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }
}

/// FEE POOL ACCOUNT
#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Recipient {
    pub address: Pubkey,
    pub share: u16, // Share in basis points (e.g., 5000 = 50%)
    pub amount: u64,
    pub locking_period: i64,
}

#[account]
pub struct FeePool {
    pub recipients: Vec<Recipient>,
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl FeePool {
    pub fn new(recipients: Vec<Recipient>, bump: u8) -> Result<Self> {
        let total_share: u16 = recipients.iter().map(|r| r.share).sum();
        if total_share != 10000 {
            return err!(CustomError::InvalidSharePercentage);
        }
        let current_time = Clock::get()?.unix_timestamp;

        // make sure amount is 0 in all recipients in initial state
        let recipients = recipients
            .iter()
            .map(|r| Recipient {
                address: r.address,
                share: r.share,
                amount: 0,
                locking_period: current_time + r.locking_period,
            })
            .collect();

        Ok(Self {
            recipients,
            total_fees_collected: 0,
            bump,
        })
    }
}

pub trait FeePoolAccount<'info> {
    fn calculate_fee(&mut self, amount: u64) -> Result<()>;
    fn add_fee_recipients(&mut self, recipients: Vec<Recipient>) -> Result<()>;
    fn claim_fee(
        &mut self,
        user: &Signer<'info>,
        fee_pool_vault: &mut AccountInfo<'info>,
        token: &mut AccountInfo<'info>,
        system_program: &Program<'info, System>,
        bump: u8,
    ) -> Result<()>;
}

impl<'info> FeePoolAccount<'info> for Account<'info, FeePool> {
    fn calculate_fee(&mut self, amount: u64) -> Result<()> {
        // Update total fees collected
        self.total_fees_collected = self
            .total_fees_collected
            .checked_add(amount)
            .ok_or(error!(CustomError::OverFlowUnderFlowOccured))?;

        for recipient in self.recipients.iter_mut() {
            recipient.amount = amount * (recipient.share as u64) / 10000;
        }
        msg!("total fees collected {}", self.total_fees_collected);
        msg!("recipients {:?}", self.recipients);
        Ok(())
    }

    fn add_fee_recipients(&mut self, new_recipients: Vec<Recipient>) -> Result<()> {
        let old_recipients = self.recipients.clone();

        let updated_recipients: Vec<Recipient> = new_recipients
            .into_iter()
            .map(|mut new_recipient| {
                if let Some(old_recipient) = old_recipients
                    .iter()
                    .find(|r| r.address == new_recipient.address)
                {
                    new_recipient.amount = old_recipient.amount;
                }
                new_recipient
            })
            .collect();

        let total_share: u16 = updated_recipients.iter().map(|r| r.share).sum();
        if total_share != 10000 {
            return err!(CustomError::InvalidSharePercentage);
        }
        msg!("updated recipients {:?}", updated_recipients);
        // Update recipients list
        self.recipients = updated_recipients;

        Ok(())
    }

    fn claim_fee(
        &mut self,
        user: &Signer<'info>,
        fee_pool_vault: &mut AccountInfo<'info>,
        token: &mut AccountInfo<'info>,
        system_program: &Program<'info, System>,
        bump: u8,
    ) -> Result<()> {
        let public_key = user.key();
        let recipient = self
            .recipients
            .iter()
            .find(|r| r.address == public_key)
            .ok_or(CustomError::FeeRecipientNotFound)?;
        let amount = recipient.amount;
        system_program::transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: fee_pool_vault.to_account_info().clone(),
                    to: user.to_account_info().clone(),
                },
                &[&[
                    FEE_POOL_VAULT_PREFIX.as_bytes(),
                    token.key().as_ref(),
                    &[bump],
                ]],
            ),
            amount,
        )?;

        // update amount in fee pool
        self.recipients
            .iter_mut()
            .find(|r| r.address == public_key)
            .unwrap()
            .amount = 0;
        self.total_fees_collected -= amount;

        Ok(())
    }
}
