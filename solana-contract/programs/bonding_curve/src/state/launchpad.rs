use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LaunchType {
    Whitelist,
    FairLaunch,
}

#[account]
pub struct LaunchPadAccount {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub vault: Pubkey,
    pub launch_type: LaunchType,
    pub whitelist_data: Option<Pubkey>, 
    pub fair_launch_data: Option<Pubkey>, 
    pub bump: u8,
}

#[account]
pub struct WhitelistLaunchData {
    pub launchpad: Pubkey,              // Reference to parent LaunchPadAccount
    pub token_price: u64,               // Price per token in lamports
    pub purchase_limit_per_wallet: u64, // Maximum tokens per wallet
    pub total_supply: u64,              // Total tokens available for sale
    pub sold_tokens: u64,               // Tokens sold so far
    pub whitelisted_users: Vec<Pubkey>, // List of whitelisted addresses
    pub buyers: Vec<Pubkey>,            // List of purchasers
    pub paused: bool,                   // Emergency pause state
    pub whitelist_duration: i64,        // Duration of whitelist period
    pub bump: u8,                       // PDA bump seed
}

#[account]
pub struct FairLaunchData {
    pub launchpad: Pubkey,              // Reference to parent LaunchPadAccount
    pub vault: Pubkey,                  // SOL contribution vault
    pub soft_cap: u64,                  // Minimum funding goal in lamports
    pub hard_cap: u64,                  // Maximum funding goal in lamports
    pub min_contribution: u64,          // Minimum contribution per wallet in lamports
    pub max_contribution: u64,          // Maximum contribution per wallet in lamports
    pub max_tokens_per_wallet: u64,     // Maximum tokens per wallet (anti-whale)
    pub distribution_delay: i64,        // Hours to wait before distribution (0 for immediate)
    pub total_raised: u64,              // Total amount raised so far
    pub bump: u8,                       // PDA bump seed
}

impl LaunchPadAccount {
    pub const ACCOUNT_SIZE: usize = 32 + 32 + 8 + 8 + 32 + 1 + (1 + 32) + (1 + 32) + 1; // ~150 bytes

    pub fn new_whitelist(
        authority: Pubkey,
        token_mint: Pubkey,
        vault: Pubkey,
        start_time: i64,
        end_time: i64,
        whitelist_data: Pubkey,
        bump: u8,
    ) -> Self {
        Self {
            authority,
            token_mint,
            start_time,
            end_time,
            vault,
            launch_type: LaunchType::Whitelist,
            whitelist_data: Some(whitelist_data),
            fair_launch_data: None,
            bump,
        }
    }

    pub fn new_fair_launch(
        authority: Pubkey,
        token_mint: Pubkey,
        vault: Pubkey,
        start_time: i64,
        end_time: i64,
        fair_launch_data: Pubkey,
        bump: u8,
    ) -> Self {
        Self {
            authority,
            token_mint,
            start_time,
            end_time,
            vault,
            launch_type: LaunchType::FairLaunch,
            whitelist_data: None,
            fair_launch_data: Some(fair_launch_data),
            bump,
        }
    }
}

impl WhitelistLaunchData {
    pub const ACCOUNT_SIZE: usize = 5000; // Includes space for vectors

    pub fn new(
        launchpad: Pubkey,
        token_price: u64,
        purchase_limit_per_wallet: u64,
        total_supply: u64,
        whitelist_duration: i64,
        bump: u8,
    ) -> Self {
        Self {
            launchpad,
            token_price,
            purchase_limit_per_wallet,
            total_supply,
            sold_tokens: 0,
            whitelisted_users: vec![],
            buyers: vec![],
            paused: false,
            whitelist_duration,
            bump,
        }
    }
}

impl FairLaunchData {
    // Fixed size account
    pub const ACCOUNT_SIZE: usize = 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1; // ~130 bytes

    pub fn new(
        launchpad: Pubkey,
        vault: Pubkey,
        soft_cap: u64,
        hard_cap: u64,
        min_contribution: u64,
        max_contribution: u64,
        max_tokens_per_wallet: u64,
        distribution_delay: i64,
        bump: u8,
    ) -> Self {
        Self {
            launchpad,
            vault,
            soft_cap,
            hard_cap,
            min_contribution,
            max_contribution,
            max_tokens_per_wallet,
            distribution_delay,
            total_raised: 0,
            bump,
        }
    }
}

#[account]
pub struct BuyerAccount {
    pub buyer: Pubkey,
    pub amount: u64,
    pub whitelisted: bool,
    pub launchpad: Pubkey, 
    pub bump: u8,
}

impl BuyerAccount {
    pub const ACCOUNT_SIZE: usize = 32 + 8 + 1 + 32 + 1; // ~75 bytes
}
