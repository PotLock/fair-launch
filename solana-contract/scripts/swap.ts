import AmmImpl, { MAINNET_POOL, PROGRAM_ID } from '@mercurial-finance/dynamic-amm-sdk';
import { PublicKey, Connection, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

import { getKeypairFromFile } from './utils';
import os from 'os';
import BN from 'bn.js';
import { derivePoolAddressWithConfig } from '@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/utils';
import idl from "../target/idl/bonding_curve.json";


// Connection, Wallet, and AnchorProvider to interact with the network
const connection = new Connection('https://api.devnet.solana.com');

const payer = getKeypairFromFile(`${os.homedir()}/.config/solana/id.json`);
console.log("Wallet: ", payer.publicKey.toBase58());


const anchorConnection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl('devnet'),
    'confirmed'
);
const wallet = new anchor.Wallet(payer);
const provider = new anchor.AnchorProvider(anchorConnection, wallet, {
    preflightCommitment: 'confirmed',
});
anchor.setProvider(provider);

const program = new anchor.Program(idl as anchor.Idl, provider);



const WSOL = new PublicKey('So11111111111111111111111111111111111111112');
// My token 
const tokenMint = new PublicKey('3YChZhQqYpriRAiNunKLRxF5jnTuj97RE4SHBBHNAJsu');

const configPubkey = new PublicKey('21PjsfQVgrn56jSypUT5qXwwSjwKWvuoBCKbVZrgTLz4');


async function swap() {
    const programID = new PublicKey(PROGRAM_ID);
    const poolPubkey = derivePoolAddressWithConfig(WSOL, tokenMint, configPubkey, programID);
    const pool = await AmmImpl.create(connection, poolPubkey, { cluster: 'devnet' });
    const poolInfoBefore = pool.poolInfo;
    console.log("Pool Info Token A before: ", poolInfoBefore.tokenAAmount.toString());
    console.log("Pool Info Token B before: ", poolInfoBefore.tokenBAmount.toString());
    const inAmountLamport = new BN(0.01 * 10 ** pool.tokenAMint.decimals);

    const { minSwapOutAmount } = pool.getSwapQuote(
        new PublicKey(pool.tokenAMint.address),
        inAmountLamport,
        10
    );
    console.log("Min Swap Out Amount: ", minSwapOutAmount.toString());
    const swapTx = await pool.swap(
        wallet.publicKey,
        new PublicKey(pool.tokenAMint.address),
        inAmountLamport,
        minSwapOutAmount,
    );
    const swapResult = await provider.sendAndConfirm(swapTx);
    console.log("Swap Result: ", swapResult);
}


swap();

