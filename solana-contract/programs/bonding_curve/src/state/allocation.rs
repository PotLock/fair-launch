use anchor_lang::prelude::*;


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Vesting {
    pub cliff_period: i64,         // seconds before vesting starts
    pub start_time: i64,           // unix timestamp when vesting starts
    pub duration: i64,             // total vesting duration in seconds
    pub interval: i64,             // interval between releases (seconds)
    pub released: u64,             // tokens already released
}

#[account]
pub struct Allocation {
    pub category: String,          // e.g. "Team", "Advisors"
    pub wallet: Pubkey,            // Recipient wallet
    pub percentage: u8,            // % of total supply
    pub total_tokens: u64,         // Calculated at creation
    pub claimed_tokens: u64,       // Amount already claimed
    pub vesting: Option<Vesting>,  // Optional vesting schedule
    pub bump: u8,                  // PDA bump
}