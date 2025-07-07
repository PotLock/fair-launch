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
import { useAnchorWallet } from "@solana/wallet-adapter-react";
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
import { getPDAs, getAllocationPDAs, getFairLaunchPDAs } from "../utils/sol";
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
  const { program, connection,mintKeypair } = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const createTokenTransaction = async (): Promise<Transaction> => {
    if (!anchorWallet?.publicKey || !mintKeypair?.publicKey || !connection || !program) {
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
      anchorWallet?.publicKey
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
        updateAuthority: anchorWallet?.publicKey,
        mint: mintKeypair.publicKey,
        mintAuthority: anchorWallet?.publicKey,
        payer: anchorWallet?.publicKey,
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
        fromPubkey: anchorWallet?.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        anchorWallet?.publicKey,
        anchorWallet?.publicKey,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        anchorWallet?.publicKey,
        tokenATA,
        anchorWallet?.publicKey,
        mintKeypair.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        anchorWallet?.publicKey,
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
          anchorWallet?.publicKey,
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
          anchorWallet?.publicKey,
          AuthorityType.FreezeAccount,
          new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress)
        )
      );
    }

    return transaction;
  };

  const createBondingCurveTransaction = async (): Promise<Transaction> => {
    if (!anchorWallet?.publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    const { curveConfig } = await getPDAs(
      anchorWallet?.publicKey,
      mintKeypair.publicKey,
      program
    );

    const feePercentage = 100;
    const initialQuorum = new BN(500);
    const targetLiquidity = new BN(dexListing.liquidityPercentage > 0 ? dexListing.liquidityPercentage : 1000000000);
    const daoQuorum = 500;
    const bondingCurveType = 0;
    
    // Calculate maxTokenSupply from basic info
    const supply = basicInfo.supply || "0";
    const decimals = Number(basicInfo.decimals || 0);
    
    if (isNaN(decimals) || decimals < 0) {
      throw new Error("Invalid token decimals value");
    }
    
    let maxTokenSupplyValue: string;
    if (decimals === 0) {
      maxTokenSupplyValue = supply;
    } else {
      maxTokenSupplyValue = supply + "0".repeat(decimals);
    }
    
    const maxTokenSupply = new BN(maxTokenSupplyValue);
    const liquidityLockPeriod = new BN(dexListing.liquidityLockupPeriod || 60);
    const liquidityPoolPercentage = dexListing.liquidityPercentage > 0 ? dexListing.liquidityPercentage : 50;
    const initialReserve = new BN(100000000);
    const initialSupply = new BN(100000000);
    const reserveRatio = 5000;

    // Create recipients array from allocation data
    const recipients = allocation.map((item) => {
      if (!item.walletAddress) {
        throw new Error(`Invalid wallet address: address is empty`);
      }
      try {
        const share = Math.round(item.percentage * 100);
        return {
          address: new PublicKey(item.walletAddress),
          share,
          amount: new BN(0),
          lockingPeriod: new BN(item.lockupPeriod || 60000),
        };
      } catch (error) {
        throw new Error(`Invalid wallet address: ${item.walletAddress}`);
      }
    });

    // Validate total share percentage equals 10000 (100%)
    const totalShare = recipients.reduce((sum, item) => sum + item.share, 0);
    if (totalShare !== 10000) {
      throw new Error(`Total allocation percentage must equal 100%. Current total: ${totalShare / 100}%`);
    }

    const instruction = await program.methods
      .initialize(
        anchorWallet?.publicKey,
        feePercentage,
        initialQuorum,
        targetLiquidity,
        anchorWallet?.publicKey,
        daoQuorum,
        bondingCurveType,
        maxTokenSupply,
        liquidityLockPeriod,
        liquidityPoolPercentage,
        initialReserve,
        initialSupply,
        recipients,
        reserveRatio
      )
      .accountsStrict({
        bondingCurveConfiguration: curveConfig,
        admin: anchorWallet?.publicKey,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId
      })
      .instruction();

    return new Transaction().add(instruction);
  };

  const createAllocationTransactions = async (): Promise<Transaction[]> => {
    if (!anchorWallet?.publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    if (!allocation || allocation.length === 0) {
      return [];
    }

    const allocationWallets = allocation.map(item => new PublicKey(item.walletAddress));
    const { allocations, allocationTokenAccounts } = await getAllocationPDAs(mintKeypair.publicKey, allocationWallets, program.programId);

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
          tokenMint: mintKeypair.publicKey,
          allocationVault: allocationTokenAccounts[i],
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          authority: anchorWallet?.publicKey,
        })
        .instruction();

      transactions.push(new Transaction().add(instruction));
    }

    return transactions;
  };

  const createFairLaunchTransaction = async (): Promise<Transaction> => {
    if (!anchorWallet?.publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    const { launchpad, fairLaunchData, launchpadTokenAccount, contributionVault } = await getFairLaunchPDAs(
      anchorWallet?.publicKey,
      mintKeypair.publicKey,
      anchorWallet?.publicKey,
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
        launchPadAccount: launchpad,
        fairLaunchData: fairLaunchData,
        tokenMint: mintKeypair.publicKey,
        launchpadVault: launchpadTokenAccount,
        contributionVault: contributionVault,
        authority: anchorWallet?.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    return new Transaction().add(instruction);
  };

  const createLiquidityPoolTransaction = async (): Promise<Transaction> => {
    if (!anchorWallet?.publicKey || !mintKeypair?.publicKey || !program) {
      throw new Error("Required dependencies not available");
    }

    const { curveConfig, bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = await getPDAs(
      anchorWallet?.publicKey,
      mintKeypair.publicKey,
      program
    );

    const instruction = await program.methods
      .createPool()
      .accountsStrict({
        bondingCurveConfiguration: curveConfig,
        bondingCurveAccount: bondingCurve,
        tokenMint: mintKeypair.publicKey,
        poolTokenAccount: poolTokenAccount,
        poolSolVault: poolSolVault,
        userTokenAccount: userTokenAccount,
        user: anchorWallet?.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID
      })
      .instruction();

    return new Transaction().add(instruction);
  };

  const generateTransactions = async (): Promise<Transaction[]> => {
    if (!anchorWallet?.publicKey || !connection || !program?.programId || !mintKeypair?.publicKey) {
      throw new Error("Please connect wallet and ensure all dependencies are available");
    }

    // Validate basic info
    if (!basicInfo.name || !basicInfo.symbol || !basicInfo.supply || !basicInfo.decimals) {
      throw new Error("Basic token information is incomplete");
    }
    
    const transactions: Transaction[] = [];
    const { blockhash } = await connection.getLatestBlockhash();

    // Generate token transaction
    const tokenTransaction = await createTokenTransaction();
    tokenTransaction.recentBlockhash = blockhash;
    tokenTransaction.feePayer = anchorWallet?.publicKey;
    tokenTransaction.partialSign(mintKeypair)
    const tokenTx = await anchorWallet?.signTransaction(tokenTransaction);
    transactions.push(tokenTx);

    // Generate bonding curve transaction
    // const bondingCurveTransaction = await createBondingCurveTransaction();
    // bondingCurveTransaction.recentBlockhash = blockhash;
    // bondingCurveTransaction.feePayer = anchorWallet?.publicKey;
    // const bondingCurveTx = await anchorWallet?.signTransaction(bondingCurveTransaction);
    // transactions.push(bondingCurveTx);

    // Generate allocation transactions
    // const allocationTransactions = await createAllocationTransactions();
    // allocationTransactions.forEach(async (tx) => {
    //   tx.recentBlockhash = blockhash;
    //   tx.feePayer = anchorWallet?.publicKey;
    //   const allocationTx = await anchorWallet?.signTransaction(tx);
    //   transactions.push(allocationTx);
    // });
    // transactions.push(...allocationTransactions);

    // Generate fair launch transaction
    // const fairLaunchTransaction = await createFairLaunchTransaction();
    // fairLaunchTransaction.recentBlockhash = blockhash;
    // fairLaunchTransaction.feePayer = anchorWallet?.publicKey;
    // const fairLaunchTx = await anchorWallet?.signTransaction(fairLaunchTransaction);
    // transactions.push(fairLaunchTx);

    // // Generate liquidity pool transaction
    // const liquidityPoolTransaction = await createLiquidityPoolTransaction();
    // liquidityPoolTransaction.recentBlockhash = blockhash;
    // liquidityPoolTransaction.feePayer = anchorWallet?.publicKey;
    // const liquidityPoolTx = await anchorWallet?.signTransaction(liquidityPoolTransaction);
    // transactions.push(liquidityPoolTx);

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
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            const signedTx = await anchorWallet?.signTransaction(transaction);
            const rawTx = signedTx?.serialize() || new Uint8Array(0);
            const txId = await connection.sendRawTransaction(rawTx);
            await connection.confirmTransaction(txId);
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

  const deployToken = useCallback(async () => {
    try {
      if (!anchorWallet?.publicKey) {
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

      // Generate all transactions first
      const transactionList = await generateTransactions();

      console.log(`Initiating bulk transaction execution for ${transactionList.length} transactions`);
      const txResults = await executeTransactions(transactionList);
      
      console.log("\n=== Transaction Results ===");
      let successCount = 0;
      txResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Transaction ${index + 1}: ${result.value}`);
          successCount++;
        } else {
          console.log(`Transaction ${index + 1} failed:`, result.reason);
          // Show specific error messages based on transaction type
          if (index === 0) {
            toast.error(`Token creation failed: ${result.reason}`);
          } else if (index === 1) {
            toast.error(`Bonding curve creation failed: ${result.reason}`);
          } else if (index < 2 + allocation.length) {
            toast.error(`Allocation creation failed: ${result.reason}`);
          } else if (index === 2 + allocation.length) {
            toast.error(`Fair launch creation failed: ${result.reason}`);
          } else {
            toast.error(`Liquidity pool creation failed: ${result.reason}`);
          }
        }
      });

      if (successCount === transactionList.length) {
        toast.success("Token deployed successfully! 🎉");
        return txResults[0].status === 'fulfilled' ? txResults[0].value : undefined; // Return the first transaction ID
      } else {
        toast.error(`Deployment partially failed. ${successCount}/${transactionList.length} transactions succeeded.`);
      }

    } catch (error) {
      console.error('Deploy token error:', error);
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [anchorWallet, connection, program, mintKeypair, basicInfo, allocation, dexListing, adminSetup, saleSetup, selectedTemplate, selectedPricing, selectedExchange]);

  return { deployToken };
};