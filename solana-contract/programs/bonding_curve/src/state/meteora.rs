use anchor_lang::prelude::*;

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

pub fn get_function_hash(namespace: &str, name: &str) -> [u8; 8] {
    let preimage = format!("{}:{}", namespace, name);
    let mut sighash = [0u8; 8];
    sighash.copy_from_slice(
        &anchor_lang::solana_program::hash::hash(preimage.as_bytes()).to_bytes()[..8],
    );
    sighash
}


