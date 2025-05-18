use crate::errors::CustomError;
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
    pub liquidity_pool_percentage: u16, // Percentage of the bonding curve liquidity pool that is migrated to the DEX,
    pub initial_reserve: u64, // Initial reserve of the token in SOL
    pub initial_supply: u64, // Initial supply of the token
}

impl CurveConfiguration {
    // Discriminator (8) + u64(8) + bool(1) + Pubkey(32) + u16(2) + bool(1) + u64(8) + u16(2) + bool(1) + u8(1) + u64(8) + i64(8) + u16(2) + u64(8) + u64(8)
    pub const ACCOUNT_SIZE: usize = 8 + 8 + 1 + 32 + 2 + 1 + 8 + 2 + 1 + 1 + 8 + 8 + 2 + 8 + 8;

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
        initial_reserve: u64,
        initial_supply: u64,
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
            initial_reserve,
            initial_supply,
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

