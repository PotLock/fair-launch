import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { findMintMetadataId } from "@solana-nft-programs/common";
import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { useCallback } from "react";
import toast from "react-hot-toast";
import useAnchorProvider from "./useAnchorProvider";
import { getPDAs, getAllocationPDAs, getFairLaunchPDAs, getBondingCurveConfig } from "../utils/sol";
import { useDeployStore } from "../stores/deployStores";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Keypair } from "@solana/web3.js";
import { Metadata } from "../types";


const TX_INTERVAL = 1000;

const uploadMetadataToPinata = async (metadata: Metadata) => {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.PUBLIC_JWT_PINATA_SECRET}`
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw error;
  }
};

export const useDeployToken = () => {
  const { basicInfo, socials, allocation, dexListing, saleSetup, adminSetup, selectedTemplate, selectedPricing, selectedExchange } = useDeployStore();
  const { program, connection, mintKeypair } = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const walletSol = useWallet();
  const { publicKey, sendTransaction, signTransaction } = walletSol;


  const createTokenTransaction = async (): Promise<Transaction> => {
    if (!publicKey || !mintKeypair?.publicKey || !connection || !program) {
      throw new Error("Required dependencies not available");
    }

    const decimals = Number(basicInfo.decimals || 9);
    const supply = basicInfo.supply || "1000000";

    // Calculate mint amount with decimals
    let mintAmount: string;
    if (decimals === 0) {
      mintAmount = supply;
    } else {
      mintAmount = supply + "0".repeat(decimals);
    }

    const mintAmountNumber = Number(mintAmount);
    if (isNaN(mintAmountNumber) || mintAmountNumber <= 0) {
      throw new Error("Invalid mint amount calculated");
    }

    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const tokenATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      publicKey
    );

    const metadataSocials = {
      website: socials.website || "",
      twitter: socials.twitter || "",
      telegram: socials.telegram || "",
      discord: socials.discord || "",
      farcaster: socials.farcaster || "",
    }

    // Upload metadata to Pinata
    const metadataUri = await uploadMetadataToPinata({
      name: basicInfo.name,
      symbol: basicInfo.symbol,
      description: basicInfo.description || "",
      image: basicInfo.avatarUrl || "",
      banner: basicInfo.bannerUrl || "",
      template: selectedTemplate,
      pricing: selectedPricing,
      exchange: selectedExchange,
      social: metadataSocials
    });

    const mintMetadataId = findMintMetadataId(mintKeypair.publicKey);

    const metadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: mintMetadataId,
        updateAuthority: publicKey,
        mint: mintKeypair.publicKey,
        mintAuthority: publicKey,
        payer: publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: basicInfo.name,
            symbol: basicInfo.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        publicKey,
        publicKey,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        publicKey,
        tokenATA,
        publicKey,
        mintKeypair.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        publicKey,
        mintAmountNumber
      ),
      metadataInstruction
    );

    // Add authority revocation instructions if enabled
    if (adminSetup.revokeMintAuthority.isEnabled) {
      if (!adminSetup.revokeMintAuthority.walletAddress?.trim()) {
        throw new Error("Mint authority wallet address is required when revoke mint authority is enabled");
      }
      transaction.add(
        createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.MintTokens,
          new PublicKey(adminSetup.revokeMintAuthority.walletAddress)
        )
      );
    }

    if (adminSetup.revokeFreezeAuthority.isEnabled) {
      if (!adminSetup.revokeFreezeAuthority.walletAddress?.trim()) {
        throw new Error("Freeze authority wallet address is required when revoke freeze authority is enabled");
      }
      transaction.add(
        createSetAuthorityInstruction(
          mintKeypair.publicKey,
          publicKey,
          AuthorityType.FreezeAccount,
          new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress)
        )
      );
    }

    return transaction;
  };

  const createBondingCurveTransaction = async (): Promise<Transaction> => {
    if (!publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    // const index = new BN(0);
    // const mintExample = new PublicKey("EnGe9Wmd8VQdqbvBZgFz6XbTohTwCDwmUpEVsiU1MAHB");
    // const curveConfig = await getBondingCurveConfig(publicKey, index.toNumber(), program);
    // const { bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = await getPDAs(publicKey, publicKey, mintExample, program);
    // console.log("curveConfig", curveConfig.toBase58());
    // console.log("bondingCurve", bondingCurve.toBase58());
    // console.log("poolTokenAccount", poolTokenAccount.toBase58());
    // console.log("poolSolVault", poolSolVault.toBase58());
    // console.log("userTokenAccount", userTokenAccount.toBase58());
    // console.log("mintKeypair", mintKeypair.publicKey.toBase58());

    // const feePercentage = 100;
    // const initialQuorum = new BN(500);
    // const targetLiquidity = new BN(dexListing.liquidityPercentage > 0 ? dexListing.liquidityPercentage : 1000000000);
    // const daoQuorum = 500;
    // const bondingCurveType = 0;

    // // Calculate maxTokenSupply from basic info
    // const supply = basicInfo.supply || "0";
    // const decimals = Number(basicInfo.decimals || 0);

    // if (isNaN(decimals) || decimals < 0) {
    //   throw new Error("Invalid token decimals value");
    // }

    // let maxTokenSupplyValue: string;
    // if (decimals === 0) {
    //   maxTokenSupplyValue = supply;
    // } else {
    //   maxTokenSupplyValue = supply + "0".repeat(decimals);
    // }

    // const maxTokenSupply = new BN(maxTokenSupplyValue);
    // const liquidityLockPeriod = new BN(dexListing.liquidityLockupPeriod || 60);
    // const liquidityPoolPercentage = dexListing.liquidityPercentage > 0 ? dexListing.liquidityPercentage : 50;

    const index = new BN(4);

    const curveConfig = await getBondingCurveConfig(publicKey, index.toNumber(), program)
    const mintExample = new PublicKey("FbFX9KdCbSBExQP64FyJEbuWQo3VM9cTVmaojCNqF4fL")
    const { bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = getPDAs(publicKey, mintKeypair.publicKey, program)
    console.log("publicKey", publicKey.toBase58())
    console.log("curveConfig", curveConfig.toBase58())
    console.log("poolTokenAccount", poolTokenAccount.toBase58())
    console.log("poolSolVault", poolSolVault.toBase58())
    console.log("userTokenAccount", userTokenAccount.toBase58())
    console.log("bondingCurve", bondingCurve.toBase58())
    console.log("mintExample", mintKeypair.publicKey.toBase58())


    // Fee Percentage : 100 = 1%
    const feePercentage = new BN(100);
    const initialQuorum = new BN(500);
    const targetLiquidity = new BN(1000000000);
    const daoQuorum = new BN(500);
    // 0 is linear, 1 is quadratic
    const bondingCurveType = 0;
    const maxTokenSupply = new BN(10000000000);
    const liquidityLockPeriod = new BN(60); // 30 days
    const liquidityPoolPercentage = new BN(50); // 50%
    // const initialPrice = new BN(100); // 0.0000001 SOL
    // const initialSupply = new BN(100_000_000_000); // 10000 SPL tokens with 6 decimals 

    const initialPrice = new BN(100000); // 0.0000001 SOL
    const initialSupply = new BN(100_000_000_000); // 10000 SPL tokens with 6 decimals 

    const reserveRatio = new BN(5000); // 50%
    // Create recipients array from allocation data
    // const recipients = allocation.map((item) => {
    //   if (!item.walletAddress) {
    //     throw new Error(`Invalid wallet address: address is empty`);
    //   }
    //   try {
    //     const share = Math.round(item.percentage * 100);
    //     return {
    //       address: new PublicKey(item.walletAddress),
    //       share,
    //       amount: new BN(0),
    //       lockingPeriod: new BN(item.lockupPeriod || 60000),
    //     };
    //   } catch (error) {
    //     throw new Error(`Invalid wallet address: ${item.walletAddress}`);
    //   }
    // });
    const feeRecipient = Keypair.generate();
    let recipients = [
      {
        address: feeRecipient.publicKey,
        share: 10000,
        amount: new BN(0),
        lockingPeriod: new BN(60000),
      },
    ]
    console.log("recipients", recipients)

    const instruction = await program.methods
      .createPool(
        index,
        publicKey,
        feePercentage,
        initialQuorum,
        targetLiquidity,
        publicKey,
        daoQuorum,
        bondingCurveType,
        maxTokenSupply,
        liquidityLockPeriod,
        liquidityPoolPercentage,
        initialPrice,
        initialSupply,
        recipients,
        reserveRatio
      )
      .accountsStrict({
        bondingCurveConfiguration: curveConfig,
        bondingCurveAccount: bondingCurve,
        tokenMint: mintKeypair.publicKey,
        poolTokenAccount: poolTokenAccount,
        poolSolVault: poolSolVault,
        userTokenAccount: userTokenAccount,
        admin: publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID
      })
      .signers([walletSol as any])
      .instruction();

    return new Transaction().add(instruction);
  };

  const createAllocationTransactions = async (): Promise<Transaction[]> => {
    if (!publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    const mintExample = new PublicKey("EnGe9Wmd8VQdqbvBZgFz6XbTohTwCDwmUpEVsiU1MAHB")
    if (!allocation || allocation.length === 0) {
      return [];
    }

    const allocationWallets = allocation.map(item => new PublicKey(item.walletAddress));
    const { allocations, allocationTokenAccounts } = getAllocationPDAs(mintExample, allocationWallets, program.programId);

    const transactions: Transaction[] = [];

    for (let i = 0; i < allocation.length; i++) {
      const item = allocation[i];
      const percentage = new BN(item.percentage || 0);

      // Calculate totalTokens from basic info
      const supply = basicInfo.supply || "0";
      const decimals = Number(basicInfo.decimals || 0);

      if (isNaN(decimals) || decimals < 0) {
        throw new Error("Invalid token decimals value");
      }

      let totalTokensValue: string;
      if (decimals === 0) {
        totalTokensValue = supply;
      } else {
        totalTokensValue = supply + "0".repeat(decimals);
      }

      const totalTokens = new BN(totalTokensValue);
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = new BN(currentTime + 1000);
      const cliffPeriod = new BN(item.lockupPeriod || 1000);
      const duration = new BN(item.lockupPeriod || 1000);
      const interval = new BN(1000);
      const released = new BN(0);

      const vesting = {
        cliffPeriod,
        startTime,
        duration,
        interval,
        released,
      };

      const instruction = await program.methods
        .createAllocation("Allocation", percentage.toNumber(), totalTokens, vesting)
        .accountsStrict({
          allocation: allocations[i],
          wallet: allocationWallets[i],
          tokenMint: mintExample,
          allocationVault: allocationTokenAccounts[i],
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          authority: publicKey,
        })
        .signers([walletSol as any])
        .instruction();

      transactions.push(new Transaction().add(instruction));
    }

    return transactions;
  };

  const createFairLaunchTransaction = async (): Promise<Transaction> => {
    if (!publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    const { fairLaunchData, launchpadTokenAccount, contributionVault } = await getFairLaunchPDAs(
      publicKey,
      mintKeypair.publicKey,
      publicKey,
      program.programId
    );

    const softCap = new BN(Number(saleSetup.softCap) || 1_000_000_000);
    const hardCap = new BN(Number(saleSetup.hardCap) || 10_000_000_000);
    const minContribution = new BN(Number(saleSetup.minimumContribution) || 100_000_000);
    const maxContribution = new BN(Number(saleSetup.maximumContribution) || 2_000_000_000);
    const maxTokensPerWallet = new BN(Number(saleSetup.maxTokenPerWallet) || 1000);
    const distributionDelay = new BN(saleSetup.distributionDelay || 3600);
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = new BN(currentTime + 60);
    const endTime = new BN(currentTime + 3600);

    const instruction = await program.methods
      .createFairLaunch(
        softCap,
        hardCap,
        startTime,
        endTime,
        minContribution,
        maxContribution,
        maxTokensPerWallet,
        distributionDelay
      )
      .accountsStrict({
        fairLaunchData: fairLaunchData,
        tokenMint: mintKeypair.publicKey,
        launchpadVault: launchpadTokenAccount,
        contributionVault: contributionVault,
        authority: publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([walletSol as any])
      .instruction();

    return new Transaction().add(instruction);
  };


  const generateTransactions = async (): Promise<Transaction[]> => {
    if (!publicKey || !connection || !program?.programId || !mintKeypair?.publicKey) {
      throw new Error("Please connect wallet and ensure all dependencies are available");
    }

    // Validate basic info
    if (!basicInfo.name || !basicInfo.symbol || !basicInfo.supply || !basicInfo.decimals) {
      throw new Error("Basic token information is incomplete");
    }

    const transactions: Transaction[] = [];

    // Generate token transaction
    // const tokenTransaction = await createTokenTransaction();
    // transactions.push(tokenTransaction);

    // Generate bonding curve transaction
    // const bondingCurveTransaction = await createBondingCurveTransaction();
    // bondingCurveTransaction.recentBlockhash = blockhash;
    // bondingCurveTransaction.feePayer = publicKey;
    // transactions.push(bondingCurveTransaction);

    // //Generate allocation transactions
    // const allocationTransactions = await createAllocationTransactions();
    // allocationTransactions.forEach(async (tx) => {
    //   tx.recentBlockhash = blockhash;
    //   tx.feePayer = publicKey;
    //   transactions.push(tx);
    // });
    // transactions.push(...allocationTransactions);

    // // Generate fair launch transaction
    // const fairLaunchTransaction = await createFairLaunchTransaction();
    // fairLaunchTransaction.recentBlockhash = blockhash;
    // fairLaunchTransaction.feePayer = publicKey;
    // transactions.push(fairLaunchTransaction);

    // // Generate liquidity pool transaction
    // const liquidityPoolTransaction = await createLiquidityPoolTransaction();
    // liquidityPoolTransaction.recentBlockhash = blockhash;
    // liquidityPoolTransaction.feePayer = publicKey;
    // transactions.push(liquidityPoolTransaction);

    // Log transaction sizes
    transactions.forEach((tx, index) => {
      const size = tx.serialize().length;
      console.log(`Transaction ${index + 1} size: ${size} bytes`);
      if (size > 1232) {
        console.warn(`Transaction ${index + 1} approaching size limit!`);
      }
    });

    return transactions;
  };

  const executeTransactions = async (transactionList: Transaction[]): Promise<PromiseSettledResult<string>[]> => {
    if (!connection) {
      throw new Error("Connection and signTransaction not available");
    }

    const staggeredTransactions: Promise<string>[] = transactionList.map((transaction, i, allTx) => {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
            const txId = await sendTransaction(
              transaction,
              connection,
              { signers: [mintKeypair] }
            );
            resolve(txId);
          } catch (error) {
            console.error(`Transaction ${i + 1} failed:`, error);
            reject(error);
          }
        }, i * TX_INTERVAL);
      });
    });

    return await Promise.allSettled(staggeredTransactions);
  };

  const executeTransaction = async (transaction: Transaction): Promise<string> => {
    if (!connection) {
      throw new Error("Connection and signTransaction not available");
    }

    const signature = await sendTransaction(
      transaction,
      connection
    );

    return signature;
  };

  const deployToken = useCallback(async () => {
    try {
      if (!publicKey) {
        toast.error("Please connect wallet!");
        return;
      }

      if (!program?.programId) {
        toast.error("Program not initialized!");
        return;
      }

      if (!mintKeypair?.publicKey) {
        toast.error("Mint keypair not initialized!");
        return;
      }

      if (!connection) {
        toast.error("Solana connection not available!");
        return;
      }

      // Get latest blockhash once
      const { blockhash } = await connection.getLatestBlockhash();

      // Create individual transactions to get their instructions
      const tokenTransaction = await createTokenTransaction();
      const bondingCurveTransaction = await createBondingCurveTransaction();

      // Create a single transaction with all instructions
      const combinedTransaction = new Transaction();
      
      // Add all instructions from token transaction
      combinedTransaction.add(...tokenTransaction.instructions);
      
      // Add all instructions from bonding curve transaction  
      combinedTransaction.add(...bondingCurveTransaction.instructions);

      // Set transaction properties
      combinedTransaction.feePayer = publicKey;
      combinedTransaction.recentBlockhash = blockhash;

      // Partial sign with mintKeypair (this is required for mint creation)
      combinedTransaction.partialSign(mintKeypair);

      console.log("\n=== SIMULATING TRANSACTION ===");

      // Simulate the transaction (dry-run)
      const simulation = await connection.simulateTransaction(combinedTransaction);

      console.log("✅ Simulation successful!");
      console.log("Logs:", simulation.value.logs);
      console.log("Units consumed:", simulation.value.unitsConsumed);

      if (simulation.value.err) {
        console.log("❌ Simulation error:", simulation.value.err);
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      console.log("🎉 Transaction would succeed!");

      // Execute the transaction
      const signature = await sendTransaction(combinedTransaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });

      console.log("Transaction signature:", signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      toast.success("Token deployed successfully! 🎉");
      return signature;

    } catch (error) {
      console.log("❌ Error during deployment:", error);
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [anchorWallet, connection, program, mintKeypair, basicInfo, allocation, dexListing, adminSetup, saleSetup, selectedTemplate, selectedPricing, selectedExchange, sendTransaction, publicKey]);

  return { deployToken };
};