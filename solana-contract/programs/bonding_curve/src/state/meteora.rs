use anchor_lang::prelude::*;

use crate::utils::get_function_hash;

#[derive(AnchorSerialize, AnchorDeserialize)]
struct CpiMeteoraPoolArgs {
    token_a_amount: u64,
    token_b_amount: u64,
}

pub fn get_meteora_pool_create_ix_data(amount_a: u64, amount_b: u64) -> Vec<u8> {
    let hash = get_function_hash(
        "global",
        "initialize_permissionless_constant_product_pool_with_config",
    );
    let mut buf: Vec<u8> = vec![];
    buf.extend_from_slice(&hash);
    let args = CpiMeteoraPoolArgs {
        token_a_amount: amount_a,
        token_b_amount: amount_b,
    };

    args.serialize(&mut buf).unwrap();
    buf
}
