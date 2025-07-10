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
import { getPDAs, getBondingCurveConfig } from "../utils/sol";
import { useDeployStore } from "../stores/deployStores";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Metadata } from "../types";


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
    fees,
  } = useDeployStore();
  const { program, connection, mintKeypair } = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const walletSol = useWallet();
  const { publicKey, sendTransaction } = walletSol;


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

    const { curveConfig, bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = getPDAs(publicKey, mintKeypair.publicKey)

    // Fee Percentage : 100 = 1%
    const feePercentage = new BN(100);
    const initialQuorum = new BN(500);
    const daoQuorum = new BN(500);
    const targetLiquidity = new BN(1000000000);

    // 0 is linear, 1 is quadratic
    const bondingCurveType = 0;
    const maxTokenSupply = new BN(10000000000); // total supply
    const liquidityLockPeriod = new BN(60); // 30 days
    const liquidityPoolPercentage = new BN(50); // 50%
    // const initialPrice = new BN(100); // 0.0000001 SOL
    // const initialSupply = new BN(100_000_000_000); // 10000 SPL tokens with 6 decimals 

    const initialPrice = new BN(1000); // 0.0000001 SOL
    const initialSupply = new BN(100_000_000_000); // 10000 SPL tokens with 6 decimals 

    const reserveRatio = new BN(5000); // 50%
    const feeRecipient = new PublicKey(fees.feeRecipientAddress);

    let recipients = [
      {
        address: feeRecipient,
        share: 10000,
        amount: new BN(0),
        lockingPeriod: new BN(Math.floor(Date.now() / 1000) + (dexListing.liquidityLockupPeriod * 24 * 60 * 60)),
      },
    ]
    console.log("recipients", recipients)

    const instruction = await program.methods
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