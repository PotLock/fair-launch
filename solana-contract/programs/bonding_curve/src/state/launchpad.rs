use anchor_lang::prelude::*;

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
}


impl LaunchPadAccount {
    pub const ACCOUNT_SIZE: usize = 5000;

    pub fn new(authority: Pubkey, token_mint: Pubkey, vault: Pubkey, token_price: u64, purchase_limit_per_wallet: u64, bump: u8) -> Self {
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
        }
    }
}

#[account]
pub struct BuyerAccount {
    pub buyer: Pubkey,
    pub amount: u64,
    pub whitelisted: bool
}
