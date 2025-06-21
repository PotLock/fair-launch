use crate::errors::CommonCustomError;
use anchor_lang::prelude::*;

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
            _ => Err(CommonCustomError::InvalidBondingCurveType.into()),
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

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Recipient {
    pub address: Pubkey,
    pub share: u16, // Share in basis points (e.g., 5000 = 50%)
    pub amount: u64,
    pub locking_period: i64,
}

/// CURVE CONFIGURATION ACCOUNT
#[account]
pub struct CurveConfiguration {
    pub global_admin: Pubkey,
    pub fee_admin: Pubkey,
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
    pub liquidity_pool_percentage: u16, // Percentage of the bonding curve liquidity pool that is migrated to the DEX,
    pub initial_reserve: u64,           // Initial reserve of the token in SOL
    pub initial_supply: u64,            // Initial supply of the token,
    pub fee_recipients: Vec<Recipient>,
    pub total_fees_collected: u64,
    pub reserve_ratio: u16,   // Reserve ratio in basis points (default: 50%)
}

impl CurveConfiguration {
    // Discriminator (8) + Pubkey(32) + Pubkey(32) + u64(8) + bool(1) + u16(2) + Pubkey(32) + u16(2) + bool(1) + u64(8) + u16(2) + bool(1) + u8(1) + u64(8) + i64(8) + u16(2) + u64(8) + u64(8)
    // todo : limit number of fee recipients for init account
    pub const ACCOUNT_SIZE: usize =
        8 + 32 + 32 + 8 + 1 + 2 + 32 + 2 + 1 + 8 + 2 + 1 + 1 + 8 + 8 + 2 + 8 + 8 + 500;

    pub fn new(
        admin: Pubkey,
        initial_quorum: u64,
        fee_percentage: u16,
        target_liquidity: u64,
        governance: Pubkey,
        dao_quorum: u16,
        bonding_curve_type: u8,
        max_token_supply: u64,
        liquidity_lock_period: i64,
        liquidity_pool_percentage: u16,
        initial_reserve: u64,
        initial_supply: u64,
        fee_recipients: Vec<Recipient>,
        reserve_ratio: u16,
    ) -> Result<Self> {
        let bonding_curve_type =
            BondingCurveType::try_from(bonding_curve_type).unwrap_or(BondingCurveType::Linear);

        let total_share: u16 = fee_recipients.iter().map(|r| r.share).sum();
        if total_share != 10000 {
            return Err(CommonCustomError::InvalidSharePercentage.into());
        }
        let current_time = Clock::get()?.unix_timestamp;

        // make sure amount is 0 in all recipients in initial state
        let recipients = fee_recipients
            .iter()
            .map(|r| Recipient {
                address: r.address,
                share: r.share,
                amount: 0,
                locking_period: current_time + r.locking_period,
            })
            .collect();

        Ok(Self {
            global_admin: admin,
            fee_admin: admin,
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
            initial_reserve,
            initial_supply,
            fee_recipients: recipients,
            total_fees_collected: 0,
            reserve_ratio,
        })
    }
}

pub trait CurveConfigurationAccount<'info> {
    fn toggle_dao(&mut self) -> Result<()>;
    fn update_fee_percentage(&mut self, new_fee_percentage: u16) -> Result<()>;
    fn calculate_fee(&mut self, amount: u64) -> Result<()>;
    fn add_fee_recipients(&mut self, new_recipients: Vec<Recipient>) -> Result<()>;
    fn change_fee_admin(&mut self, new_fee_admin: Pubkey) -> Result<()>;
}

impl<'info> CurveConfigurationAccount<'info> for Account<'info, CurveConfiguration> {
    fn toggle_dao(&mut self) -> Result<()> {
        if self.use_dao {
            return Err(CommonCustomError::DAOAlreadyActivated.into());
        }
        self.use_dao = true;
        Ok(())
    }

    fn update_fee_percentage(&mut self, new_fee_percentage: u16) -> Result<()> {
        // Maximum fee is 10%
        if new_fee_percentage <= 1000_u16 {
            return Err(CommonCustomError::InvalidFee.into());
        }
        self.fee_percentage = new_fee_percentage;
        Ok(())
    }
    fn calculate_fee(&mut self, amount: u64) -> Result<()> {
        // Update total fees collected
        self.total_fees_collected = self
            .total_fees_collected
            .checked_add(amount)
            .ok_or(CommonCustomError::OverFlowUnderFlowOccured)?;

        for recipient in self.fee_recipients.iter_mut() {
            recipient.amount = amount * (recipient.share as u64) / 10000;
        }
        Ok(())
    }

    fn add_fee_recipients(&mut self, new_recipients: Vec<Recipient>) -> Result<()> {
        let old_recipients = self.fee_recipients.clone();

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
            return Err(CommonCustomError::InvalidSharePercentage.into());
        }
        msg!("updated recipients {:?}", updated_recipients);
        // Update recipients list
        self.fee_recipients = updated_recipients;

        Ok(())
    }

    fn change_fee_admin(&mut self, new_fee_admin: Pubkey) -> Result<()> {
        self.fee_admin = new_fee_admin;
        Ok(())
    }
}
