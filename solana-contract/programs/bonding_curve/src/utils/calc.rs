use crate::{errors::CustomError};
use anchor_lang::prelude::*;



pub struct CalculatedBuyCost {
    pub reserve_amount: u64,
    pub treasury_amount: u64
}

pub struct CalculatedSellCost {
    pub reserve_amount: u64,
    pub treasury_amount: u64
}

// calculate the initial reserve amount based on the initial price (SOL) and initial supply (token)
pub fn calculate_initial_reserve_linear(initial_price: u64, initial_supply: u64, reserve_ratio: u16, token_decimals: u8) -> Result<u64> {
    let initial_supply = initial_supply.checked_div(10u64.pow(token_decimals as u32)).ok_or(CustomError::OverFlowUnderFlowOccured)?;
    
    // initial_price * initial_supply
    let initial_market_cap: u128 = (initial_price as u128)
        .checked_mul(initial_supply as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    // initial_reserve_amount = (initial_market_cap * reserve_ratio) / 10000
    let reserve_amount = initial_market_cap
        .checked_mul(reserve_ratio as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_div(10000)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    Ok(reserve_amount as u64)
}
pub fn linear_buy_cost(amount: u64, reserve_ratio: u16, total_supply: u64) -> Result<u64> {
    let new_supply = total_supply
        .checked_add(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let new_supply_squared = (new_supply as u128)
        .checked_mul(new_supply as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let total_supply_squared = (total_supply as u128)
        .checked_mul(total_supply as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let numerator = new_supply_squared
        .checked_sub(total_supply_squared)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_div(2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let denominator = (reserve_ratio as u128)
        .checked_mul(10000)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let cost = numerator
        .checked_div(denominator)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    if cost > u64::MAX as u128 {
        return Err(CustomError::OverFlowUnderFlowOccured.into());
    }

    Ok(cost as u64)
}

pub fn linear_sell_cost(amount: u64, reserve_ratio: u16, total_supply: u64) -> Result<u64> {
    if amount > total_supply {
        return Err(CustomError::InsufficientBalance.into());
    }

    let new_supply = total_supply
        .checked_sub(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let total_supply_squared = (total_supply as u128)
        .checked_mul(total_supply as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let new_supply_squared = (new_supply as u128)
        .checked_mul(new_supply as u128)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let numerator = total_supply_squared
        .checked_sub(new_supply_squared)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_div(2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let denominator = (reserve_ratio as u128)
        .checked_mul(10000)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let reward = numerator
        .checked_div(denominator)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    if reward > u64::MAX as u128 {
        return Err(CustomError::OverFlowUnderFlowOccured.into());
    }

    Ok(reward as u64)
}

pub fn quadratic_buy_cost(amount: u64, reserve_ratio: u16, total_supply: u64) -> Result<u64> {
    // Convert to u128 for intermediate calculations to prevent overflow
    let amount = amount as u128;
    let supply = total_supply as u128;
    let k = (reserve_ratio as u128)
        .checked_div(10000)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let term1 = k
        .checked_mul(supply)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let term2 = k
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_div(2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let cost = term1
        .checked_add(term2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    if cost > u64::MAX as u128 {
        return Err(CustomError::OverFlowUnderFlowOccured.into());
    }

    Ok(cost as u64)
}

pub fn quadratic_sell_cost(amount: u64, reserve_ratio: u16, total_supply: u64) -> Result<u64> {
    if amount > total_supply {
        return Err(CustomError::InsufficientBalance.into());
    }

    let amount = amount as u128;
    let supply = total_supply as u128;
    let k = (reserve_ratio as u128)
        .checked_div(10000)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let term1 = k
        .checked_mul(supply)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let term2 = k
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_mul(amount)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?
        .checked_div(2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    let reward = term1
        .checked_sub(term2)
        .ok_or(CustomError::OverFlowUnderFlowOccured)?;

    if reward > u64::MAX as u128 {
        return Err(CustomError::OverFlowUnderFlowOccured.into());
    }

    Ok(reward as u64)
}
