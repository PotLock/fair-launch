import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BondingCurve } from "../target/types/bonding_curve"
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, SYSVAR_RENT_PUBKEY, clusterApiUrl } from "@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAssociatedTokenAddress } from "@solana/spl-token"
import { expect } from "chai";
import { BN } from "bn.js";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as os from "os";
import { getPDAs, getKeypairFromFile } from "./utils";
const connection = new Connection(clusterApiUrl("devnet"))


describe("bonding_curve", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const signer = provider.wallet as NodeWallet;
  console.log("Signer address:", signer.publicKey.toBase58());
  const program = anchor.workspace.BondingCurve as Program<BondingCurve>;
  // make sure your key in the correct dir 
  let feeRecipient = getKeypairFromFile(`${os.homedir()}/.config/solana/id2.json`);
  let feeRecipient2 = getKeypairFromFile(`${os.homedir()}/.config/solana/id3.json`);
  console.log("Fee address1 :", feeRecipient.publicKey.toBase58());
  console.log("Fee address2 :", feeRecipient2.publicKey.toBase58());
  // get existing TokenMint and TokenATA or we can create new token 
  const mint = new PublicKey("BU38GveW5z5N61kuazeSJSPJCcQt9fn4SYZboBCxBVpz");
  //5ZoKnNrLwDw5FSgjuA7S7uSEsYPDHrhPzQ7bUTZxdtSa

  const multisig = new PublicKey("97S2XVwgi9fiHJQst9qkN1EeVKbXYy1LUS3MDL3BfxpN");

  const feeRecipient3 = Keypair.generate();
  const governance = Keypair.generate();


  it("Initialize the contract", async () => {

    try {
      const { curveConfig } = await getPDAs(signer.payer.publicKey, mint)
      // Fee Percentage : 100 = 1%
      const feePercentage = new BN(100);
      const initialQuorum = new BN(500);
      const targetLiquidity = new BN(10000000);
      const daoQuorum = new BN(500);
      // 0 is linear, 1 is quadratic
      const bondingCurveType = 0;
      const tx = new Transaction()
        .add(
          await program.methods
            .initialize(initialQuorum, feePercentage, targetLiquidity, governance.publicKey, daoQuorum, bondingCurveType)
            .accounts({
              dexConfigurationAccount: curveConfig,
              admin: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true, commitment: "confirmed" })
      console.log("Successfully initialized : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      // let curveConfigAccount = await program.account.curveConfiguration.fetch(curveConfig)
      // console.log("Curve Configuration Data : ", curveConfigAccount)
    } catch (error) {
      console.log("Error in initialization :", error)
    }
  });

  it(" create bonding curve pool", async () => {

    try {


      const { bondingCurve, feePool } = await getPDAs(signer.payer.publicKey, mint)
      let recipients = [
        {
          address: feeRecipient.publicKey,
          share: 10000,
          amount: new BN(0),
        },
      ]
      const tx = new Transaction()
        .add(
          await program.methods
            .createPool(recipients)
            .accounts({
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              feePoolAccount: feePool,
              payer: signer.payer.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully created pool : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      // let bondingCurveAccount = await program.account.bondingCurve.fetch(bondingCurve)
      // console.log("Bonding Curve Data : ", bondingCurveAccount)
    } catch (error) {
      console.log("Error in initialization :", error)
    }

  })

  it(" add fee recipients", async () => {

    try {


      const { curveConfig, bondingCurve, feePool } = await getPDAs(signer.payer.publicKey, mint)

      let recipients = [
        {
          address: feeRecipient.publicKey,
          // 40%
          share: 4000,
          amount: new BN(0),
        },
        {
          address: feeRecipient2.publicKey,
          // 40%
          share: 4000,
          amount: new BN(0),
        },
        {
          address: multisig,
          // 20%
          share: 2000,
          amount: new BN(0),
        }
      ]
      const tx = new Transaction()
        .add(
          await program.methods
            .addFeeRecipients(recipients)
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              feePoolAccount: feePool,
              authority: signer.payer.publicKey,
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully add fee recipients : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
    } catch (error) {
      console.log("Error in add fee recipients :", error)
    }

  })


  it(" add liquidity to the pool by user created a pool", async () => {

    try {
      const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } = await getPDAs(signer.payer.publicKey, mint)
      let amount = new BN(100000000000); // 100 SPL token 
      const tx = new Transaction()
        .add(
          await program.methods
            .addLiquidity(amount)
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              poolSolVault: poolSolVault,
              poolTokenAccount: poolTokenAccount,
              userTokenAccount: userTokenAccount,
              user: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully add liquidity : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
      const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
      console.log("User Balance : ", userBalance)
      console.log("Pool Balance : ", poolBalance)
    } catch (error) {
      console.log("Error in add liquidity :", error)
    }
  })


  // Should be error because the user not created a pool
  // it(" add liquidity to the pool with another user not created a pool", async () => {

  //   try {
  //     const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } = await getPDAs(feeRecipient.publicKey, mint)
  //     let amount = new BN(100000000000); // 100 SPL token 
  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .addLiquidity(amount)
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //             poolSolVault: poolSolVault,
  //             poolTokenAccount: poolTokenAccount,
  //             userTokenAccount: userTokenAccount,
  //             user: feeRecipient.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = feeRecipient.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [feeRecipient], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully add liquidity : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
  //     const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
  //     console.log("User Balance : ", userBalance)
  //     console.log("Pool Balance : ", poolBalance)
  //   } catch (error) {
  //     console.log("Error in add liquidity :", error)
  //   }
  // })


  it(" buy from the pool", async () => {

    try {


      const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, feePool } = await getPDAs(signer.payer.publicKey, mint)

      const tx = new Transaction()
        .add(
          await program.methods
            .buy(new BN(100000000))
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              poolSolVault: poolSolVault,
              feePoolAccount: feePool,
              poolTokenAccount: poolTokenAccount,
              userTokenAccount: userTokenAccount,
              user: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully buy : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
      const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
      console.log("User Balance : ", userBalance)
      console.log("Pool Balance : ", poolBalance)
    } catch (error) {
      console.log("Error in buy from pool :", error)
    }
  })


  it(" sell from the pool", async () => {

    try {


      const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump, feePool } = await getPDAs(signer.payer.publicKey, mint)

      const tx = new Transaction()
        .add(
          await program.methods
            .sell(new BN(1000000), poolSolVaultBump)
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              poolSolVault: poolSolVault,
              feePoolAccount: feePool,
              poolTokenAccount: poolTokenAccount,
              userTokenAccount: userTokenAccount,
              user: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully sell : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
      const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
      console.log("User Balance : ", userBalance)
      console.log("Pool Balance : ", poolBalance)
    } catch (error) {
      console.log("Error in sell from pool :", error)
    }
  })

  it(" claim fee from the fee pool", async () => {

    try {


      const { curveConfig, bondingCurve, feePool, feePoolVault, feePoolVaultBump } = await getPDAs(signer.payer.publicKey, mint)

      const tx = new Transaction()
        .add(
          await program.methods
            .claimFee(feePoolVaultBump)
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              feePoolAccount: feePool,
              feePoolVault: feePoolVault,
              tokenMint: mint,
              user: feeRecipient.publicKey,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = feeRecipient.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [feeRecipient], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully claim fee from the pool fee : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
    } catch (error) {
      console.log("Error in claim fee from the pool fee :", error)
    }
  })



  it(" remove liquidity to the pool", async () => {

    try {
      const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump } = await getPDAs(signer.payer.publicKey, mint)
      const tx = new Transaction()
        .add(
          await program.methods
            .removeLiquidity(poolSolVaultBump)
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              poolSolVault: poolSolVault,
              poolTokenAccount: poolTokenAccount,
              userTokenAccount: userTokenAccount,
              user: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
      console.log("Successfully initialized : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
      const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
      const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
      console.log("User Balance : ", userBalance)
      console.log("Pool Balance : ", poolBalance)
    } catch (error) {
      console.log("Error in add liquidity :", error)
    }
  })


});


