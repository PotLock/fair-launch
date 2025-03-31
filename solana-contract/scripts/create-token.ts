// Create token testing scripts

import { createMint, createAssociatedTokenAccountInstruction, mintTo, getAssociatedTokenAddress , transfer} from "@solana/spl-token"
import { Keypair } from "@solana/web3.js"
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import * as bs58 from "bs58";
import dotenv from "dotenv"
dotenv.config()
import { BN } from "bn.js";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Create token and transfer some tokens to user test  
async function createToken() {
    console.log("Creating token...")
    const connection = new Connection("https://api.devnet.solana.com", {
        commitment: "confirmed",
      });
    const signer = Keypair.fromSecretKey(bs58.decode(process.env.SIGNER_PRIVATE_KEY))
    const user = Keypair.fromSecretKey(bs58.decode(process.env.USER_PRIVATE_KEY))

    const amount = 1000000000000000 // 1,000,000 token  
    // Create token mint with 9 decimals
    const mintAccount = await createMint(connection, signer, signer.publicKey, signer.publicKey, 9)
    console.log("Mint:", mintAccount.toBase58())

    // await sleep(1000);
    const ata = await getOrCreateAssociatedTokenAccount(connection, signer, mintAccount, signer.publicKey)
    console.log("ATA:", ata.toBase58())

    await mintTo(connection, signer, mintAccount, ata, signer.publicKey, BigInt(amount.toString()))
    await sleep(1000);
    console.log("Token created and transferred to user test")
    
    // Transfer token to user test
    const userATA = await getOrCreateAssociatedTokenAccount(connection, user, mintAccount, user.publicKey)
    console.log("User ATA:", userATA.toBase58())
    const amountUser = 100000000000000 // 100,000 token  
    // Transfer token to user test
    const transferTx = await transfer(connection, signer, ata, userATA, signer.publicKey, BigInt(amountUser.toString()))
    await sleep(1000);
    console.log("Token transferred to user test:", transferTx)


}
async function getOrCreateAssociatedTokenAccount(connection, payer, mint, owner) {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    try {
        const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
        if (accountInfo) {
            return associatedTokenAddress;
        }
    } catch (error) {
        console.log('Account does not exist. Creating a new one.');
    }

    const createAccountInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey, associatedTokenAddress, owner, mint
    );

    const transaction = new Transaction().add(createAccountInstruction);
    await sendAndConfirmTransaction(connection, transaction, [payer], { skipPreflight: false, preflightCommitment: 'confirmed' });

    return associatedTokenAddress;
}


createToken()