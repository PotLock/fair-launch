import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BondingCurve } from "../target/types/bonding_curve"
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram, SYSVAR_RENT_PUBKEY, clusterApiUrl, TransactionInstruction } from "@solana/web3.js"

import { BN } from "bn.js";
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as os from "os";
import { getPDAs, getKeypairFromFile, METEORA_PROGRAM_ID, METEORA_VAULT_PROGRAM_ID, SOL_MINT, getMeteoraPDA, getVaultPDA, getProtocolTokenFeePDA, METAPLEX_PROGRAM, deriveMintMetadata, TEST_CONFIG, getAssociatedTokenAccount, createProgram } from "./utils";
import { getOrCreateATAInstruction } from "@mercurial-finance/vault-sdk/dist/cjs/src/vault/utils";
import { derivePoolAddressWithConfig } from "@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/utils";
import VaultImpl from "@mercurial-finance/vault-sdk";
import { NATIVE_MINT } from "@solana/spl-token";
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
  // const mint = new PublicKey("3YChZhQqYpriRAiNunKLRxF5jnTuj97RE4SHBBHNAJsu");
  //5ZoKnNrLwDw5FSgjuA7S7uSEsYPDHrhPzQ7bUTZxdtSa
  const mint = new PublicKey("9nNrWDKsbQZoHHU7bHkfNPC3iicvMFGasyWpEfEnXxAj");

  const multisig = new PublicKey("97S2XVwgi9fiHJQst9qkN1EeVKbXYy1LUS3MDL3BfxpN");

  const feeRecipient3 = Keypair.generate();
  const governance = Keypair.generate();
  const { vaultProgram } = createProgram(connection);

  // it("Initialize the contract", async () => {

  //   try {
  //     const { curveConfig, feePool } = getPDAs(signer.payer.publicKey, mint)
  //     console.log("Curve Config : ", curveConfig.toBase58())
  //     // Fee Percentage : 100 = 1%
  //     const feePercentage = new BN(100);
  //     const initialQuorum = new BN(500);
  //     const targetLiquidity = new BN(10000000);
  //     const daoQuorum = new BN(500);
  //     // 0 is linear, 1 is quadratic
  //     const bondingCurveType = 1;
  //     const maxTokenSupply = new BN(10000000000);
  //     const liquidityLockPeriod = new BN(60); // 30 days
  //     const liquidityPoolPercentage = new BN(50); // 50%

  //     let recipients = [
  //       {
  //         address: feeRecipient.publicKey,
  //         share: 10000,
  //         amount: new BN(0),
  //         lockingPeriod: new BN(60000),
  //       },
  //     ]


  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //             // @ts-ignore
  //           .initialize(initialQuorum, feePercentage, targetLiquidity, governance.publicKey, daoQuorum, bondingCurveType, maxTokenSupply, liquidityLockPeriod, liquidityPoolPercentage, recipients)
  //           .accounts({
  //             // @ts-ignore
  //             configurationAccount: curveConfig,
  //             tokenMint: mint,
  //             feePoolAccount: feePool,
  //             admin: signer.payer.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true, commitment: "confirmed" })
  //     console.log("Successfully initialized : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //   } catch (error) {
  //     console.log("Error in initialization :", error)
  //   }
  // });

  // it(" create bonding curve pool", async () => {

  //   try {


  //     const { bondingCurve } = getPDAs(signer.payer.publicKey, mint )
  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .createPool()
  //           .accounts({
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             payer: signer.payer.publicKey,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully created pool : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     // let bondingCurveAccount = await program.account.bondingCurve.fetch(bondingCurve)
  //     // console.log("Bonding Curve Data : ", bondingCurveAccount)
  //   } catch (error) {
  //     console.log("Error in create pool :", error)
  //   }

  // })

  // it(" add fee recipients", async () => {

  //   try {


  //     const { curveConfig, bondingCurve, feePool } = await getPDAs(signer.payer.publicKey, mint, id)

  //     let recipients = [
  //       {
  //         address: feeRecipient.publicKey,
  //         // 40%
  //         share: 4000,
  //         amount: new BN(0),
  //         lockingPeriod: new BN(60000),
  //       },
  //       {
  //         address: feeRecipient2.publicKey,
  //         // 40%
  //         share: 4000,
  //         amount: new BN(0),
  //         lockingPeriod: new BN(60000),
  //       },
  //       {
  //         address: multisig,
  //         // 20%
  //         share: 2000,
  //         amount: new BN(0),
  //         lockingPeriod: new BN(60000),
  //       }
  //     ]
  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .addFeeRecipients(recipients)
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             feePoolAccount: feePool,
  //             authority: signer.payer.publicKey,
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully add fee recipients : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //   } catch (error) {
  //     console.log("Error in add fee recipients :", error)
  //   }

  // })


  // it(" add liquidity to the pool by user created a pool", async () => {

  //   try {
  //     const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } =  getPDAs(signer.payer.publicKey, mint)
  //     console.log("Curve Config : ", curveConfig.toBase58())
  //     console.log("Bonding Curve : ", bondingCurve.toBase58())
  //     console.log("Pool Token Account : ", poolTokenAccount.toBase58())

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
  //             user: signer.payer.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully add liquidity : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     // const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
  //     // const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
  //     // console.log("User Balance : ", userBalance)
  //     // console.log("Pool Balance : ", poolBalance)
  //   } catch (error) {
  //     console.log("Error in add liquidity :", error)
  //   }
  // })


  it(" migrate meteora pool", async () => {

    try {
      const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } = await getPDAs(signer.payer.publicKey, mint)
      // const { pool, lpMint, payerPoolLp } = await getMeteoraPDA(SOL_MINT, mint, signer.payer.publicKey);
      const { aVault, aTokenVault, aLpMintPda, bVault, bTokenVault, bLpMintPda } = getVaultPDA(SOL_MINT, mint);
      console.log("aTokenVault", aTokenVault.toBase58());
      console.log("aLpMintPda", aLpMintPda.toBase58());
      console.log("aVault", aVault.toBase58());
      console.log("bTokenVault", bTokenVault.toBase58());
      console.log("bLpMintPda", bLpMintPda.toBase58());
      console.log("bVault", bVault.toBase58());

      let aVaultLpMint = aLpMintPda;
      let bVaultLpMint = bLpMintPda;

      // test pool key 
      const pool = derivePoolAddressWithConfig(SOL_MINT, mint, TEST_CONFIG, METEORA_PROGRAM_ID);
      console.log("pool", pool.toBase58());

      const [lpMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), pool.toBuffer()],
        METEORA_PROGRAM_ID,
      );
      console.log("lpMint", lpMint.toBase58());

      const payerPoolLp = getAssociatedTokenAccount(lpMint, signer.payer.publicKey);
      console.log("payerPoolLp", payerPoolLp.toBase58());

      let preInstructions: Array<TransactionInstruction> = [];

      const [aVaultAccount, bVaultAccount] = await Promise.all([
        vaultProgram.account.vault.fetchNullable(aVault),
        vaultProgram.account.vault.fetchNullable(bVault),
      ]);

      if (!aVaultAccount) {
        const createVaultAIx = await VaultImpl.createPermissionlessVaultInstruction(provider.connection, signer.payer.publicKey, SOL_MINT);
        createVaultAIx && preInstructions.push(createVaultAIx);

      } else {
        aVaultLpMint = aVaultAccount?.lpMint; // Old vault doesn't have lp mint pda
      }
      if (!bVaultAccount) {
        const createVaultBIx = await VaultImpl.createPermissionlessVaultInstruction(provider.connection, signer.payer.publicKey, mint);
        createVaultBIx && preInstructions.push(createVaultBIx);

      } else {
        bVaultLpMint = bVaultAccount?.lpMint; // Old vault doesn't have lp mint pda
      }


      const [[aVaultLp], [bVaultLp]] = [
        PublicKey.findProgramAddressSync([aVault.toBuffer(), pool.toBuffer()], METEORA_PROGRAM_ID),
        PublicKey.findProgramAddressSync([bVault.toBuffer(), pool.toBuffer()], METEORA_PROGRAM_ID),
      ];


      const [[payerTokenA, createPayerTokenAIx], [payerTokenB, createPayerTokenBIx]] = await Promise.all([
        getOrCreateATAInstruction(SOL_MINT, signer.payer.publicKey, connection),
        getOrCreateATAInstruction(mint, signer.payer.publicKey, connection),
      ]);

      createPayerTokenAIx && preInstructions.push(createPayerTokenAIx);
      createPayerTokenBIx && preInstructions.push(createPayerTokenBIx);


      let latestBlockHash = await provider.connection.getLatestBlockhash(
        "confirmed"
      );

      if (preInstructions.length) {
        const preInstructionTx = new Transaction({
          feePayer: signer.payer.publicKey,
          ...latestBlockHash,
        }).add(...preInstructions);

        preInstructionTx.sign(signer.payer);
        const preInxSim = await connection.simulateTransaction(preInstructionTx)

        const txHash = await provider.sendAndConfirm(preInstructionTx, [], {
          commitment: "confirmed",
        });
        console.log("Successfully create payer token A and B : ", `https://solscan.io/tx/${txHash}?cluster=devnet`)
      }



      const { protocolTokenAFee, protocolTokenBFee } = getProtocolTokenFeePDA(SOL_MINT, mint, pool);
      const [mintMetadata, _mintMetadataBump] = deriveMintMetadata(lpMint);
      const setComputeUnitLimitIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 20_000_000,
      });

      const tx = new Transaction().add(setComputeUnitLimitIx)
        .add(
          await program.methods
            .migrateMeteoraPool()
            .accounts({
              dexConfigurationAccount: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              poolTokenAccount: poolTokenAccount,
              poolSolVault: poolSolVault,
              pool: pool,
              config: TEST_CONFIG,
              lpMint: lpMint,
              tokenAMint: SOL_MINT,
              tokenBMint: mint,
              aVault: aVault,
              bVault: bVault,
              aVaultLpMint: aVaultLpMint,
              bVaultLpMint: bVaultLpMint,
              aVaultLp: aVaultLp,
              bVaultLp: bVaultLp,
              aTokenVault: aTokenVault,
              bTokenVault: bTokenVault,
              payerTokenA: payerTokenA,
              payerTokenB: payerTokenB,
              payerPoolLp: payerPoolLp,
              protocolTokenAFee: protocolTokenAFee,
              protocolTokenBFee: protocolTokenBFee,
              payer: signer.payer.publicKey,
              rent: SYSVAR_RENT_PUBKEY,
              mintMetadata: mintMetadata,
              metadataProgram: METAPLEX_PROGRAM,
              vaultProgram: METEORA_VAULT_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              meteoraProgram: METEORA_PROGRAM_ID
            })
            .instruction()
        )
      tx.feePayer = signer.payer.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true })
      console.log("Successfully migrate meteora pool : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
    } catch (error) {
      console.log("Error in migrate meteora pool :", error)
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


  // it(" buy from the pool", async () => {

  //   try {


  //     const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, feePool } = await getPDAs(signer.payer.publicKey, mint, id)

  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .buy(new BN(100000000))
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //             poolSolVault: poolSolVault,
  //             feePoolAccount: feePool,
  //             poolTokenAccount: poolTokenAccount,
  //             userTokenAccount: userTokenAccount,
  //             user: signer.payer.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully buy : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
  //     const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
  //     console.log("User Balance : ", userBalance)
  //     console.log("Pool Balance : ", poolBalance)
  //   } catch (error) {
  //     console.log("Error in buy from pool :", error)
  //   }
  // })


  // it(" sell from the pool", async () => {

  //   try {


  //     const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump, feePool } = await getPDAs(signer.payer.publicKey, mint, id)

  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .sell(new BN(1000000), poolSolVaultBump)
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //             poolSolVault: poolSolVault,
  //             feePoolAccount: feePool,
  //             poolTokenAccount: poolTokenAccount,
  //             userTokenAccount: userTokenAccount,
  //             user: signer.payer.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully sell : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
  //     const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
  //     console.log("User Balance : ", userBalance)
  //     console.log("Pool Balance : ", poolBalance)
  //   } catch (error) {
  //     console.log("Error in sell from pool :", error)
  //   }
  // })

  // it(" claim fee from the fee pool", async () => {

  //   try {


  //     const { curveConfig, bondingCurve, feePool, feePoolVault, feePoolVaultBump } = await getPDAs(signer.payer.publicKey, mint, id)

  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .claimFee(feePoolVaultBump)
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             feePoolAccount: feePool,
  //             feePoolVault: feePoolVault,
  //             tokenMint: mint,
  //             user: feeRecipient.publicKey,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = feeRecipient.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [feeRecipient], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully claim fee from the pool fee : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //   } catch (error) {
  //     console.log("Error in claim fee from the pool fee :", error)
  //   }
  // })



  // it(" remove liquidity to the pool", async () => {

  //   try {
  //     const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump } = await getPDAs(signer.payer.publicKey, mint)
  //     const tx = new Transaction()
  //       .add(
  //         await program.methods
  //           .removeLiquidity(poolSolVaultBump)
  //           .accounts({
  //             dexConfigurationAccount: curveConfig,
  //             bondingCurveAccount: bondingCurve,
  //             tokenMint: mint,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
  //             poolSolVault: poolSolVault,
  //             poolTokenAccount: poolTokenAccount,
  //             userTokenAccount: userTokenAccount,
  //             user: signer.payer.publicKey,
  //             rent: SYSVAR_RENT_PUBKEY,
  //             systemProgram: SystemProgram.programId
  //           })
  //           .instruction()
  //       )
  //     tx.feePayer = signer.payer.publicKey
  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  //     const sig = await sendAndConfirmTransaction(connection, tx, [signer.payer], { skipPreflight: true , commitment: "confirmed"})
  //     console.log("Successfully initialized : ", `https://solscan.io/tx/${sig}?cluster=devnet`)
  //     const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount
  //     const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount
  //     console.log("User Balance : ", userBalance)
  //     console.log("Pool Balance : ", poolBalance)
  //   } catch (error) {
  //     console.log("Error in remove liquidity :", error)
  //   }
  // })


});


