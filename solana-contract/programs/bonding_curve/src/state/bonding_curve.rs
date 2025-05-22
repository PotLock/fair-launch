use crate::consts::*;
use crate::errors::CustomError;
use crate::state::curve_configuration::{
    BondingCurveType, CurveConfiguration, CurveConfigurationAccount,
};
use crate::utils::calc::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

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

    pub fn get_signer<'a>(bump: &'a u8, mint: &'a Pubkey) -> [&'a [u8]; 3] {
        [
            POOL_SEED_PREFIX.as_bytes(),
            mint.as_ref(),
            std::slice::from_ref(bump),
        ]
    }
}

pub trait BondingCurveAccount<'info> {
    fn calculate_buy_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64>;
    fn calculate_sell_cost(&mut self, amount: u64, bonding_curve_type: u8) -> Result<u64>;

    // Allows adding liquidity by depositing an amount of two tokens and getting back pool shares
    fn add_liquidity(
        &mut self,
        token_accounts: (
            &mut InterfaceAccount<'info, Mint>,
            &mut InterfaceAccount<'info, TokenAccount>,
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        token_amount: u64,
        sol_amount: u64,
        locked_liquidity: bool,
        authority: &Signer<'info>,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    // Allows removing liquidity by burning pool shares and receiving back a proportionate amount of tokens
    fn remove_liquidity(
        &mut self,
        token_accounts: (
            // token mint
            &mut InterfaceAccount<'info, Mint>,
            // pool token account
            &mut InterfaceAccount<'info, TokenAccount>,
            // user token account
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_account: &mut AccountInfo<'info>,
        authority: &Signer<'info>,
        bump: u8,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn buy(
        &mut self,
        bonding_configuration_account: &mut Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut InterfaceAccount<'info, Mint>,
            &mut InterfaceAccount<'info, TokenAccount>,
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        sol_amount: u64,
        fee_percentage: u16,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        reserve_ratio: u16,
        // target liquidity for migration
        target_liquidity: u64,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn sell(
        &mut self,
        bonding_configuration_account: &mut Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut InterfaceAccount<'info, Mint>,
            &mut InterfaceAccount<'info, TokenAccount>,
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        bump: u8,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        // target liquidity for migration
        target_liquidity: u64,
        token_program: &Interface<'info, TokenInterface>,
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
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        token_mint: &InterfaceAccount<'info, Mint>,
        amount: u64,
        token_program: &Interface<'info, TokenInterface>,
    ) -> Result<()>;

    fn transfer_token_to_pool(
        &self,
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        token_mint: &InterfaceAccount<'info, Mint>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Interface<'info, TokenInterface>,
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
        bonding_configuration_account: &mut Account<'info, CurveConfiguration>,
        token_accounts: (
            &mut InterfaceAccount<'info, Mint>,
            &mut InterfaceAccount<'info, TokenAccount>,
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        sol_amount: u64,
        fee_percentage: u16,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        reserve_ratio: u16,
        // target liquidity for migration
        target_liquidity: u64,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {

        let amount_out = self.calculate_buy_cost(sol_amount, bonding_curve_type)?;

        msg!("amount out {:?}", amount_out);
        let fee_in_sol = amount_out * (fee_percentage as u64) / 10000;
        msg!("fee in sol {:?}", fee_in_sol);

        // make sure the bonding curve SOL liquility is not hit target liquidity
        if self.reserve_balance + amount_out > target_liquidity {
            return err!(CustomError::TargetLiquidityReached);
        }
        self.total_supply += amount_out;
        self.reserve_balance += amount_out;
        self.reserve_token -= amount_out;
        self.transfer_sol_to_pool(authority, pool_sol_vault, amount_out, system_program)?;

        self.transfer_token_from_pool(
            token_accounts.1,
            token_accounts.2,
            token_accounts.0,
            amount_out,
            token_program,
        )?;
        // Collect fees
        bonding_configuration_account.calculate_fee(fee_in_sol)?;


        Ok(())
    }

    fn sell(
        &mut self,
        bonding_configuration_account: &mut Account<'info, CurveConfiguration>,
        token_accounts: (
            // token mint
            &mut InterfaceAccount<'info, Mint>,
            // pool token account
            &mut InterfaceAccount<'info, TokenAccount>,
            // user token account
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        amount: u64,
        fee_percentage: u16,
        bump: u8,
        authority: &Signer<'info>,
        bonding_curve_type: u8,
        // target liquidity for migration
        target_liquidity: u64,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        let amount_out = self.calculate_sell_cost(amount, bonding_curve_type)?;
        let fee = amount_out * (fee_percentage as u64) / 10000;

        // make sure the bonding curve SOL liquility is not hit target liquidity
        if self.reserve_balance + amount > target_liquidity {
            return err!(CustomError::TargetLiquidityReached);
        }

        if self.reserve_balance < amount_out {
            return err!(CustomError::NotEnoughSolInVault);
        }

        self.total_supply -= amount;
        self.reserve_balance -= amount_out;
        self.reserve_token += amount;
        self.transfer_token_to_pool(
            token_accounts.2,
            token_accounts.1,
            token_accounts.0,
            amount as u64,
            authority,
            token_program,
        )?;

        self.transfer_sol_from_pool(
            pool_sol_vault,
            authority,
            amount_out,
            bump,
            system_program,
            SOL_VAULT_PREFIX.as_bytes(),
        )?;

        bonding_configuration_account.calculate_fee(fee)?;


        Ok(())
    }

    fn add_liquidity(
        &mut self,
        token_accounts: (
            // token mint
            &mut InterfaceAccount<'info, Mint>,
            // pool token account
            &mut InterfaceAccount<'info, TokenAccount>,
            // user token account
            &mut InterfaceAccount<'info, TokenAccount>,
        ),

        pool_sol_vault: &mut AccountInfo<'info>,
        token_amount: u64,
        sol_amount: u64,
        locked_liquidity: bool,
        authority: &Signer<'info>,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        msg!("Adding liquidity to the pool");
        // Checking if the amount is greater than 0 and less than token balance
        let balance = token_accounts.2.amount;
        if token_amount == 0 || token_amount > balance {
            return err!(CustomError::InvalidAmount);
        }
        // unable to  add liquidity if the bonding curve locked
        if locked_liquidity {
            return err!(CustomError::LiquidityLocked);
        }
        // make sure the reserve balance is not exceed the target liquidity
        // TODO!

        msg!("transfer token to pool");
        self.transfer_token_to_pool(
            token_accounts.2,
            token_accounts.1,
            token_accounts.0,
            token_amount,
            authority,
            token_program,
        )?;

        msg!("transfer sol to pool");
        self.transfer_sol_to_pool(authority, pool_sol_vault, sol_amount, system_program)?;
        self.reserve_token += token_amount;
        self.reserve_balance += sol_amount;

        Ok(())
    }

    // Allows removing liquidity by burning pool shares and receiving back a proportionate amount of tokens
    fn remove_liquidity(
        &mut self,
        token_accounts: (
            // token mint
            &mut InterfaceAccount<'info, Mint>,
            // pool token account
            &mut InterfaceAccount<'info, TokenAccount>,
            // user token account
            &mut InterfaceAccount<'info, TokenAccount>,
        ),
        pool_sol_vault: &mut AccountInfo<'info>,
        authority: &Signer<'info>,
        bump: u8,
        token_program: &Interface<'info, TokenInterface>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        self.transfer_token_from_pool(
            token_accounts.1,
            token_accounts.2,
            token_accounts.0,
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
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        token_mint: &InterfaceAccount<'info, Mint>,
        amount: u64,
        token_program: &Interface<'info, TokenInterface>,
    ) -> Result<()> {
        anchor_spl::token_interface::transfer_checked(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                anchor_spl::token_interface::TransferChecked {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    mint: token_mint.to_account_info(),
                    authority: self.to_account_info(),
                },
                &[&[
                    POOL_SEED_PREFIX.as_bytes(),
                    self.token.key().as_ref(),
                    &[self.bump],
                ]],
            ),
            amount,
            token_mint.decimals,
        )?;
        Ok(())
    }

    fn transfer_token_to_pool(
        &self,
        from: &InterfaceAccount<'info, TokenAccount>,
        to: &InterfaceAccount<'info, TokenAccount>,
        token_mint: &InterfaceAccount<'info, Mint>,
        amount: u64,
        authority: &Signer<'info>,
        token_program: &Interface<'info, TokenInterface>,
    ) -> Result<()> {
        anchor_spl::token_interface::transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                anchor_spl::token_interface::TransferChecked {
                    from: from.to_account_info(),
                    mint: token_mint.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
            token_mint.decimals,
        )?;
        Ok(())
    }
}
