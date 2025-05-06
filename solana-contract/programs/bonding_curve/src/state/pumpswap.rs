use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
struct CpiPumpPoolArgs {
    index: u16,
    base_amount_in: u64,
    quote_amount_in: u64,
}

pub fn get_pump_pool_create_ix_data(index: u16, base_amount_in: u64, quote_amount_in: u64) -> Vec<u8> {
    let hash = get_function_hash(
        "global",
        "create_pool",
    );
    let mut buf: Vec<u8> = vec![];
    buf.extend_from_slice(&hash);
    let args = CpiPumpPoolArgs {
        index,
        base_amount_in,
        quote_amount_in,
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




