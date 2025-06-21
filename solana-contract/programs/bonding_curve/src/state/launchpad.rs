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
    pub vault: Pubkey,
    pub token_price: u64, // in SOL
    pub purchase_limit_per_wallet: u64,
    pub bump: u8,
    pub total_supply: u64,
    pub sold_tokens: u64,
    pub whitelisted_users: Vec<Pubkey>,
    pub buyers: Vec<Pubkey>,
    pub paused: bool,
    pub whitelist_duration: i64,
    pub start_time: i64,
    pub end_time: i64,
    pub launch_type: LaunchType,
    pub fair_launch_data: Option<Pubkey>, // Reference to FairLaunchData account
}

#[account]
pub struct FairLaunchData {
    pub launchpad: Pubkey,
    pub soft_cap: u64,           // Minimum funding goal in lamports
    pub hard_cap: u64,           // Maximum funding goal in lamports
    pub min_contribution: u64,   // Minimum contribution per wallet in lamports
    pub max_contribution: u64,   // Maximum contribution per wallet in lamports
    pub max_tokens_per_wallet: u64, // Maximum tokens per wallet (anti-whale)
    pub distribution_delay: i64, // Hours to wait before distribution (0 for immediate)
    pub total_raised: u64,       // Total amount raised so far
    pub bump: u8,
}

impl LaunchPadAccount {
    pub const ACCOUNT_SIZE: usize = 5000;

    pub fn new(authority: Pubkey, token_mint: Pubkey, vault: Pubkey, token_price: u64, purchase_limit_per_wallet: u64, whitelist_duration: i64, start_time: i64, end_time: i64, bump: u8) -> Self {
        Self {
            authority,
            token_mint,
            vault,
            token_price,
            purchase_limit_per_wallet,
            bump,
            total_supply: 0,
            sold_tokens: 0,
            whitelisted_users: vec![],
            buyers: vec![],
            paused: false,
            whitelist_duration,
            start_time,
            end_time,
            launch_type: LaunchType::Whitelist, // Default to whitelist for backward compatibility
            fair_launch_data: None,
        }
    }

    pub fn new_fair_launch(
        authority: Pubkey, 
        token_mint: Pubkey, 
        vault: Pubkey, 
        token_price: u64, 
        start_time: i64, 
        end_time: i64, 
        fair_launch_data: Pubkey,
        bump: u8
    ) -> Self {
        Self {
            authority,
            token_mint,
            vault,
            token_price,
            purchase_limit_per_wallet: 0, // Not used in fair launch
            bump,
            total_supply: 0,
            sold_tokens: 0,
            whitelisted_users: vec![],
            buyers: vec![],
            paused: false,
            whitelist_duration: 0, // Not used in fair launch
            start_time,
            end_time,
            launch_type: LaunchType::FairLaunch,
            fair_launch_data: Some(fair_launch_data),
        }
    }
}

impl FairLaunchData {
    pub const ACCOUNT_SIZE: usize = 200;

    pub fn new(
        launchpad: Pubkey,
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
    pub whitelisted: bool
}
