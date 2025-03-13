import AmmImpl, { MAINNET_POOL, PROGRAM_ID } from '@mercurial-finance/dynamic-amm-sdk';
import { PublicKey, Connection, sendAndConfirmTransaction, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

import { getKeypairFromFile, fetchBalancePool, getPDAs } from './utils';
import os from 'os';
import BN from 'bn.js';
import { createProgram, deriveCustomizablePermissionlessConstantProductPoolAddress, derivePoolAddressWithConfig } from '@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/utils';
import idl from "../target/idl/bonding_curve.json";
import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';

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

const amountWSOL = new BN(10000000);
const amountToken = new BN(1000000000);

const BONDING_CURVE_PROGRAM_ID = new PublicKey('FMxcVNYZxCv1Go7R6KeFYWFmGP9LeLzAz3ywecjM1yqA');

async function createPool() {
    const programID = new PublicKey(PROGRAM_ID);
    const poolPubkey = derivePoolAddressWithConfig(WSOL, tokenMint, configPubkey, programID);
    const { userTokenAccount, curveConfig, bondingCurve, poolSolVault, poolTokenAccount, poolSolVaultBump } = await getPDAs(wallet.publicKey, tokenMint, BONDING_CURVE_PROGRAM_ID);

    const { solBalance, tokenBalance } = await fetchBalancePool(connection, poolSolVault, poolTokenAccount);
    console.log("Sol Balance: ", solBalance);
    console.log("Token Balance: ", tokenBalance);

    try {
        // First Transaction: Remove Liquidity
        const removeLiquidityTx = new Transaction();
        const { blockhash: blockhash1 } = await connection.getLatestBlockhash('finalized');
        removeLiquidityTx.recentBlockhash = blockhash1;
        removeLiquidityTx.feePayer = wallet.payer.publicKey;

        const instructionRemoveLiquidity = await program.methods.removeLiquidity(poolSolVaultBump).accounts({
            dexConfigurationAccount: curveConfig,
            bondingCurveAccount: bondingCurve,
            tokenMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            poolSolVault: poolSolVault,
            poolTokenAccount: poolTokenAccount,
            userTokenAccount: userTokenAccount,
            user: wallet.payer.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId
        }).instruction();

        removeLiquidityTx.add(instructionRemoveLiquidity);
        removeLiquidityTx.sign(wallet.payer);

        // Send and confirm first transaction
        console.log("Sending remove liquidity transaction...");
        const removeLiquidityTxHash = await provider.connection.sendRawTransaction(
            removeLiquidityTx.serialize()
        );
        await provider.connection.confirmTransaction(removeLiquidityTxHash, 'finalized');
        console.log('Remove liquidity transaction successful:', removeLiquidityTxHash);

        // Second Transaction: Pool Creation
        console.log("Starting pool creation...");
        const poolCreationTx = new Transaction();
        const { blockhash: blockhash2 } = await connection.getLatestBlockhash('finalized');
        poolCreationTx.recentBlockhash = blockhash2;
        poolCreationTx.feePayer = wallet.payer.publicKey;

        let poolCreationTxns = await AmmImpl.createPermissionlessConstantProductPoolWithConfig(
            connection,
            wallet.publicKey,
            WSOL,
            tokenMint,
            new BN(solBalance.toString()),
            new BN(tokenBalance.toString()),
            configPubkey,
        );

        for (const transaction of poolCreationTxns) {
            transaction.sign(wallet.payer);
            const txHash = await provider.connection.sendRawTransaction(transaction.serialize());
            await provider.connection.confirmTransaction(txHash, 'finalized');
            console.log('transaction %s', txHash);
        }

    } catch (error) {
        console.error('Transaction failed:', error);
        throw error; 
    }
}
createPool();