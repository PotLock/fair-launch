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
} from "@solana/web3.js";
import { BN } from "bn.js";
import { useCallback } from "react";
import toast from "react-hot-toast";
import useAnchorProvider from "./useAnchorProvider";
import { getPDAs, getAllocationPDAs, getFairLaunchPDAs } from "../utils/sol";
import { useDeployStore } from "../stores/deployStores";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Metadata } from "../types";
import { createToken } from "../lib/api";

// Helper function to convert dates to Unix time
const toUnixTime = (dateString?: string, daysToAdd: number = 0): number => {
  if (dateString) {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000) + (daysToAdd * 24 * 60 * 60);
  }
  return Math.floor(Date.now() / 1000) + (daysToAdd * 24 * 60 * 60);
};

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
  const { 
    basicInfo, 
    socials, 
    allocation, 
    dexListing, 
    saleSetup, 
    adminSetup, 
    selectedTemplate, 
    selectedPricing, 
    selectedExchange, 
    pricingMechanism,
    fees
  } = useDeployStore();
  const provider = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const walletSol = useWallet();
  const { publicKey, sendTransaction } = walletSol;


  const createTokenTransaction = async (): Promise<Transaction> => {
    if (!publicKey || !provider?.mintKeypair?.publicKey || !provider?.connection || !provider?.program) {
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

    const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const tokenATA = await getAssociatedTokenAddress(
      provider.mintKeypair.publicKey,
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

    const mintMetadataId = findMintMetadataId(provider.mintKeypair.publicKey);

    const metadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: mintMetadataId,
        updateAuthority: publicKey,
        mint: provider.mintKeypair.publicKey,
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
        newAccountPubkey: provider.mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        provider.mintKeypair.publicKey,
        decimals,
        publicKey,
        publicKey,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        publicKey,
        tokenATA,
        publicKey,
        provider.mintKeypair.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      createMintToInstruction(
        provider.mintKeypair.publicKey,
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
          provider.mintKeypair.publicKey,
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
          provider.mintKeypair.publicKey,
          publicKey,
          AuthorityType.FreezeAccount,
          new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress)
        )
      );
    }

    return transaction;
  };

  const createBondingCurveTransaction = async (): Promise<Transaction> => {
    if (!publicKey || !provider?.mintKeypair?.publicKey || !provider?.program) {
      throw new Error("Required dependencies not available");
    }

    const { curveConfig, bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = getPDAs(publicKey, provider.mintKeypair.publicKey)

    console.log("curveConfig", curveConfig.toBase58())

    // Fee Percentage : 100 = 1%
    const feePercentage = new BN(100);
    const initialQuorum = new BN(500);
    const daoQuorum = new BN(500);
    const targetLiquidity = new BN(Number(pricingMechanism.targetRaise) * 10 ** 9);

    // 0 is linear, 1 is quadratic
    const bondingCurveType = 0;
    const maxTokenSupply = new BN(Number(basicInfo.supply) * 10 ** Number(basicInfo.decimals)); // total supply
    const liquidityLockPeriod =  new BN(toUnixTime(undefined, dexListing.liquidityLockupPeriod)); // unix timestamp
    const liquidityPoolPercentage = new BN(Number(dexListing.liquidityPercentage)); // 50%
    
    const initialPrice = new BN(Number(pricingMechanism.initialPrice) * 10 ** 9); // 0.0000001 SOL
    const initialSupply = new BN(Number(basicInfo.supply) * 10 ** Number(basicInfo.decimals)); // 10000 SPL tokens with 6 decimals 

    const reserveRatio = new BN(Number(pricingMechanism.reserveRatio) * 100); // 50% = 50 * 100
    const feeRecipient = new PublicKey(fees.feeRecipientAddress);
    console.log("feeRecipient", feeRecipient.toBase58());
    let recipients = [
      {
        address: feeRecipient,
        share: 10000,
        amount: new BN(0),
        lockingPeriod: new BN(toUnixTime(undefined, dexListing.liquidityLockupPeriod)),
      },
    ]
    console.log("recipients", recipients)

    const instruction = await provider.program.methods
      .createPool(
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
        tokenMint: provider.mintKeypair.publicKey,
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

  const createAllocationTransactions = async(): Promise<Transaction[]> => {
    if (!publicKey || !provider?.mintKeypair?.publicKey || !provider?.program) {
      throw new Error("Required dependencies not available");
    }
    
    // Get wallet addresses from allocation store data
    const wallets = allocation
      .filter(item => item.walletAddress && item.walletAddress.trim() !== '')
      .map(item => new PublicKey(item.walletAddress));
    
    if (wallets.length === 0) {
      console.log("No valid wallet addresses found in allocation data");
      return [];
    }
    
    const { allocations, allocationTokenAccounts } = getAllocationPDAs(provider.mintKeypair.publicKey, wallets);
    console.log("Allocation wallets:", wallets.map(w => w.toBase58()));
    console.log("Allocation's accounts:", allocations.map(a => a.toBase58()));
    const transactions: Transaction[] = [];

    for (let i = 0; i < wallets.length; i++) {
        const allocationItem = allocation.find(item => item.walletAddress === wallets[i].toBase58());
        if (!allocationItem) continue;
        
        let percentage = new BN(allocationItem.percentage);
        let totalTokens = new BN(Number(basicInfo.supply) * 10 ** Number(basicInfo.decimals));
        let startTime = new BN(toUnixTime(undefined, allocationItem.lockupPeriod));
        let cliffPeriod = new BN(toUnixTime(undefined, allocationItem.vesting.cliff));
        let duration = new BN(toUnixTime(undefined, allocationItem.vesting.duration));
        let interval = new BN(toUnixTime(undefined, allocationItem.vesting.interval));
        let released = new BN(0);

        let vesting = {
            cliffPeriod: cliffPeriod,
            startTime: startTime,
            duration: duration,
            interval: interval,
            released: released,
        }

        const createAllocationInstruction = await provider.program.methods
            .createAllocation(percentage.toNumber(), totalTokens, vesting)
            .accountsStrict({
                allocation: allocations[i],
                wallet: wallets[i],
                tokenMint: provider.mintKeypair.publicKey,
                allocationVault: allocationTokenAccounts[i],
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                authority: publicKey,
            })
            .instruction()

        transactions.push(new Transaction().add(createAllocationInstruction));
    }

    return transactions;
  };

  const createFairLaunchTransaction = async(): Promise<Transaction> => {

    if (!publicKey || !provider?.mintKeypair?.publicKey || !provider?.program) {
      throw new Error("Required dependencies not available");
    }

    const { fairLaunchData, launchpadTokenAccount, contributionVault } = getFairLaunchPDAs(provider.mintKeypair.publicKey);

    let softCap = new BN(Number(saleSetup.softCap) * 10 ** 9);
    let hardCap = new BN(Number(saleSetup.hardCap) * 10 ** 9);
    let minContribution = new BN(Number(saleSetup.minimumContribution) * 10 ** 9);
    let maxContribution = new BN(Number(saleSetup.maximumContribution) * 10 ** 9);
    let maxTokensPerWallet = new BN(Number(saleSetup.maxTokenPerWallet) * 10 ** 9);
    let distributionDelay = new BN(toUnixTime(undefined, saleSetup.distributionDelay));
    let currentTime = Math.floor(Date.now() / 1000);
    
    // Convert string dates to Unix timestamps
    let startTime: any;
    let endTime: any;
    
    if (saleSetup.scheduleLaunch.isEnabled && saleSetup.scheduleLaunch.launchDate) {
      // If launch date is provided, convert it to Unix time
      startTime = new BN(toUnixTime(saleSetup.scheduleLaunch.launchDate));
      console.log('start time', startTime.toNumber())
    } else {
      // Default to current time + 1 minute
      startTime = new BN(currentTime + 60);
    }
    
    if (saleSetup.scheduleLaunch.isEnabled && saleSetup.scheduleLaunch.endDate) {
      // If end date is provided, convert it to Unix time
      endTime = new BN(toUnixTime(saleSetup.scheduleLaunch.endDate));
      console.log('end time', endTime.toNumber())
    } else {
      // Default to current time + 1 hour
      endTime = new BN(currentTime + 3600);
    }

    const createFairLaunchInstruction = await provider.program.methods
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
            tokenMint: provider.mintKeypair.publicKey,
            launchpadVault: launchpadTokenAccount,
            contributionVault: contributionVault,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

    return new Transaction().add(createFairLaunchInstruction);
  };

  const deployToken = useCallback(async () => {
    try {
      if (!publicKey) {
        toast.error("Please connect wallet!");
        return;
      }

      if (!provider?.program?.programId) {
        toast.error("Program not initialized!");
        return;
      }

      if (!provider?.mintKeypair?.publicKey) {
        toast.error("Mint keypair not initialized!");
        return;
      }

      if (!provider?.connection) {
        toast.error("Solana connection not available!");
        return;
      }

      // Get latest blockhash once
      const { blockhash } = await provider.connection.getLatestBlockhash();

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
      combinedTransaction.partialSign(provider.mintKeypair);
      // console.log('mintKeypair', mintKeypair.publicKey.toBase58());

      
      // console.log("\n=== SIMULATING TRANSACTION ===");

      // Simulate the transaction (dry-run)
      const simulation = await provider.connection.simulateTransaction(combinedTransaction);

      console.log("✅ Simulation successful!");
      console.log("Logs:", simulation.value.logs);
      console.log("Units consumed:", simulation.value.unitsConsumed);

      if (simulation.value.err) {
        console.log("❌ Simulation error:", simulation.value.err);
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      // Execute the transaction
      const signature = await sendTransaction(combinedTransaction, provider.connection, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });

      // console.log("Transaction signature:", signature);

      // Wait for confirmation
      const confirmation = await provider.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      const allocationTransactions = await createAllocationTransactions();
      const fairLaunchTransaction = await createFairLaunchTransaction();

      const combinedTransaction1 = new Transaction();
      combinedTransaction1.add(...allocationTransactions);
      combinedTransaction1.add(fairLaunchTransaction);

      // Set transaction properties
      combinedTransaction1.feePayer = publicKey;
      combinedTransaction1.recentBlockhash = blockhash;

      const simulation1 = await provider.connection.simulateTransaction(combinedTransaction1);
      console.log("✅ Simulation 1 successful!");
      console.log("Logs 1:", simulation1.value.logs);
      console.log("Units consumed 1:", simulation1.value.unitsConsumed);

      if (simulation1.value.err) {
        console.log("❌ Simulation 1 error:", simulation1.value.err);
        throw new Error(`Simulation 1 failed: ${JSON.stringify(simulation1.value.err)}`);
      }

      const signature1 = await sendTransaction(combinedTransaction1, provider.connection, {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });

      const confirmation1 = await provider.connection.confirmTransaction(signature1, 'confirmed');
      if (confirmation1.value.err) {
        throw new Error(`Transaction 1 failed: ${JSON.stringify(confirmation1.value.err)}`);
      }

      // Create token record in database
      try {
        const tokenData = {
          owner: publicKey.toBase58(),
          mintAddress: provider.mintKeypair.publicKey.toBase58(),
          basicInfo,
          socials,
          allocation,
          dexListing:{
            launchLiquidityOn: dexListing.launchLiquidityOn.name,
            liquiditySource: dexListing.liquiditySource,
            liquidityData: dexListing.liquidityData,
            liquidityType: dexListing.liquidityType,
            liquidityPercentage: dexListing.liquidityPercentage,
            liquidityLockupPeriod: dexListing.liquidityLockupPeriod,
            walletLiquidityAmount: dexListing.walletLiquidityAmount,
            externalSolContribution: dexListing.externalSolContribution,
            isAutoBotProtectionEnabled: dexListing.isAutoBotProtectionEnabled,
            isAutoListingEnabled: dexListing.isAutoListingEnabled,
            isPriceProtectionEnabled: dexListing.isPriceProtectionEnabled,
          },
          fees,
          saleSetup,
          adminSetup,
          pricingMechanism,
          selectedTemplate,
          selectedPricing,
          selectedExchange,
        };

        await createToken(tokenData);
        console.log("Token record created in database successfully");
      } catch (apiError) {
        console.error("Failed to create token record in database:", apiError);
        // Don't throw here as the token was deployed successfully on-chain
        // Just log the error and show a warning toast
        toast.error("Token deployed on-chain but failed to save to database");
      }

      toast.success("Token deployed successfully! 🎉");
      return signature;

    } catch (error) {
      console.log("❌ Error during deployment:", error);
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [anchorWallet, provider, basicInfo, allocation, dexListing, adminSetup, saleSetup, selectedTemplate, selectedPricing, selectedExchange, sendTransaction, publicKey]);

  return { deployToken };
};