use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Only admin can call this function")]
    OnlyAdmin,

    #[msg("Only DAO can call this function")]
    OnlyDAO,

    #[msg("Invalid Fee")]
    InvalidFee,

    #[msg("Invalid Quorum")]
    InvalidQuorum,

    #[msg("DAO already activated")]
    DAOAlreadyActivated,

    #[msg("Overflow or underflow occured")]
    OverFlowUnderFlowOccured,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Not enough SOL in vault")]
    NotEnoughSolInVault,

    #[msg("Invalid bonding curve type")]
    InvalidBondingCurveType,

    #[msg("Recipient already exists")]
    RecipientAlreadyExists,

    #[msg("Invalid share percentage")]
    InvalidSharePercentage,

    #[msg("Fee recipient not found")]
    FeeRecipientNotFound,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Invalid authority")]
    InvalidAuthority,

    #[msg("Not ready to remove liquidity")]
    NotReadyToRemoveLiquidity,

    #[msg("Target liquidity reached")]
    TargetLiquidityReached,

    #[msg("Liquidity locked")]
    LiquidityLocked,

    #[msg("Bonding curve token B mismatch")]
    BondingCurveTokenMismatch,

    #[msg("SOL token A mismatch")]
    SOLMismatch,

    #[msg("Invalid recipient amount")]
    InvalidRecipientAmount,

    #[msg("Transfer failed")]
    TransferFailed,

    #[msg("Invalid time range")]
    InvalidTimeRange,

    #[msg("Whitelist duration over")]
    WhitelistDurationOver,

    #[msg("Cliff period not reached")]
    CliffNotReached,

    // Fair Launch specific errors
    #[msg("Sale has not started yet")]
    SaleNotStarted,

    #[msg("Sale has ended")]
    SaleEnded,

    #[msg("Contribution below minimum")]
    ContributionBelowMinimum,

    #[msg("Contribution exceeds maximum")]
    ContributionExceedsMaximum,

    #[msg("Hard cap reached")]
    HardCapReached,

    #[msg("Soft cap not reached")]
    SoftCapNotReached,

    #[msg("Distribution delay not reached")]
    DistributionDelayNotReached,

    #[msg("Max tokens per wallet exceeded")]
    MaxTokensPerWalletExceeded,

    #[msg("Invalid launch type")]
    InvalidLaunchType,

    #[msg("Sale is paused")]
    SaleIsPaused,
}
