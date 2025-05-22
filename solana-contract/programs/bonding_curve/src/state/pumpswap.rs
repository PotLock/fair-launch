use anchor_lang::prelude::*;

use crate::utils::get_function_hash;

#[derive(AnchorSerialize, AnchorDeserialize)]
struct CpiPumpPoolArgs {
    index: u16,
    base_amount_in: u64,
    quote_amount_in: u64,
    coin_creator: Pubkey,
}

pub fn get_pump_pool_create_ix_data(
    index: u16,
    base_amount_in: u64,
    quote_amount_in: u64,
    coin_creator: Pubkey,
) -> Vec<u8> {
    let hash = get_function_hash("global", "create_pool");
    let mut buf: Vec<u8> = vec![];
    buf.extend_from_slice(&hash);
    let args = CpiPumpPoolArgs {
        index,
        base_amount_in,
        quote_amount_in,
        coin_creator,
    };

    args.serialize(&mut buf).unwrap();
    buf
}
