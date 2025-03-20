import AmmImpl, { MAINNET_POOL, PROGRAM_ID } from '@mercurial-finance/dynamic-amm-sdk';
import { PublicKey, Connection, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';

import { derivePoolAddressWithConfig } from '@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/utils';


// Connection, Wallet, and AnchorProvider to interact with the network
const connection = new Connection('https://api.devnet.solana.com');



const WSOL = new PublicKey('So11111111111111111111111111111111111111112');
// My token 
const tokenMint = new PublicKey('3YChZhQqYpriRAiNunKLRxF5jnTuj97RE4SHBBHNAJsu');

const configPubkey = new PublicKey('21PjsfQVgrn56jSypUT5qXwwSjwKWvuoBCKbVZrgTLz4');

async function fetchPool() {
    const programID = new PublicKey(PROGRAM_ID);
    const poolPubkey = derivePoolAddressWithConfig(WSOL, tokenMint, configPubkey, programID);
    const pool = await AmmImpl.create(connection, poolPubkey, {cluster: 'devnet'});
    const poolInfo = pool.poolInfo;
    console.log("Pool Info Token A: ", poolInfo.tokenAAmount.toString());
    console.log("Pool Info Token B: ", poolInfo.tokenBAmount.toString());
}
fetchPool();



