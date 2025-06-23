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
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
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
import { getPDAs } from "../utils/sol";
import { useDeployStore } from "../stores/deployStores";
import { useRouter } from "@tanstack/react-router";

const uploadMetadataToPinata = async (metadata: {
    name: string;
    symbol: string;
    description?: string;
    image?: string;
    banner?: string;
}) => {
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
  const { basicInfo, allocation, dexListing, saleSetup, adminSetup } = useDeployStore();
  const walletSol = useWallet();
  const { publicKey, sendTransaction, signTransaction } = walletSol;
  const { anchorWallet, program, governanceKeypair, connection, mintKeypair } = useAnchorProvider();

  const onLaunchToken = (
    feePool: PublicKey,
    curveConfig: PublicKey
  ) => {
    try {
      if (!anchorWallet?.publicKey || !publicKey) {
        toast.error("Please connect wallet!");
        return;
      }

      // Validate basic info
      if (!basicInfo.name || !basicInfo.symbol || !basicInfo.supply || !basicInfo.decimals) {
        toast.error("Basic token information is incomplete!");
        return;
      }

      // Validate supply and decimals are valid numbers
      if (isNaN(Number(basicInfo.supply)) || Number(basicInfo.supply) <= 0) {
        toast.error("Token supply must be a valid positive number!");
        return;
      }

      if (isNaN(Number(basicInfo.decimals)) || Number(basicInfo.decimals) < 0) {
        toast.error("Token decimals must be a valid non-negative number!");
        return;
      }

      // Validate allocation data
      if (!allocation || allocation.length === 0) {
        toast.error("At least one allocation is required!");
        return;
      }

      // Validate that allocation items have valid data (not just empty defaults)
      const invalidAllocations = allocation.filter(item => 
        item.percentage <= 0 || 
        !item.walletAddress || 
        !item.walletAddress.trim()
      );
      
      if (invalidAllocations.length > 0) {
        toast.error("All allocations must have valid percentages and wallet addresses!");
        return;
      }

      // Validate total percentage equals 100
      const totalPercentage = allocation.reduce((sum, item) => sum + item.percentage, 0);
      if (totalPercentage !== 100) {
        toast.error(`Total allocation percentage must equal 100%. Current total: ${totalPercentage}%`);
        return;
      }

      // Validate all wallet addresses
      const invalidWallets = allocation.filter(item => !item.walletAddress || !item.walletAddress.trim());
      if (invalidWallets.length > 0) {
        toast.error("All allocations must have valid wallet addresses!");
        return;
      }

      // Validate wallet addresses are valid Solana addresses
      const invalidSolanaWallets = allocation.filter(item => {
        try {
          new PublicKey(item.walletAddress);
          return false;
        } catch (error) {
          return true;
        }
      });
      
      if (invalidSolanaWallets.length > 0) {
        toast.error("One or more wallet addresses are invalid Solana addresses!");
        return;
      }

      const feePercentage = new BN(100);
      const initialQuorum = new BN(500);
      const daoQuorum = new BN(500);
      const bondingCurveType = 1;
      const maxTokenSupply = new BN(10000000000);

      const recipients = allocation.map((item) => {
        if (!item.walletAddress) {
          throw new Error(`Invalid wallet address: address is empty`);
        }
        try {
          const share = Math.round(item.percentage * 100);
          // console.log(`Converting ${item.percentage}% to ${share} basis points`);
          return {
            share,
            address: new PublicKey(item.walletAddress),
            lockingPeriod: new BN(item.lockupPeriod),
            amount: new BN(0),
          };
        } catch (error) {
          throw new Error(`Invalid wallet address: ${item.walletAddress}`);
        }
      });

      // Validate total share percentage equals 10000 (100%)
      const totalShare = recipients.reduce((sum, item) => sum + item.share, 0);
      // console.log(`Total share in basis points: ${totalShare}`);
      if (totalShare !== 10000) {
        toast.error(`Total allocation percentage must equal 100%. Current total: ${totalShare / 100}%`);
        return;
      }

      // Debug logging
      // console.log("Final recipients:", recipients);
      // console.log("Total share:", recipients.reduce((sum, item) => sum + item.share, 0));

      // Get target liquidity based on liquidity source type
      let targetLiquidity = new BN(1);
      switch (dexListing.liquiditySource) {
        case 'wallet':
          const walletAmount = dexListing.walletLiquidityAmount || (dexListing.liquidityData as any)?.solAmount || 0;
          targetLiquidity = new BN(walletAmount);
          break;
        case 'sale':
          targetLiquidity = new BN(saleSetup.softCap || 0);
          break;
        case 'bonding':
          targetLiquidity = new BN(dexListing.liquidityPercentage);
          break;
        case 'team':
          targetLiquidity = new BN(dexListing.liquidityPercentage);
          break;
        case 'external':
          targetLiquidity = new BN(dexListing.liquidityPercentage);
          break;
        case 'hybrid':
          targetLiquidity = new BN(dexListing.liquidityPercentage);
          break;
        default:
          targetLiquidity = new BN(0);
      }

      return program.methods
        .initialize(
          initialQuorum,
          feePercentage,
          targetLiquidity,
          governanceKeypair.publicKey,
          daoQuorum,
          bondingCurveType,
          maxTokenSupply,
          new BN(dexListing.liquidityLockupPeriod),
          new BN(dexListing.liquidityPercentage),
          recipients
        )
        .accounts({
          configurationAccount: curveConfig,
          admin: publicKey,
          tokenMint: mintKeypair.publicKey,
          feePoolAccount: feePool,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([walletSol as any])
        .instruction();
    } catch (error) {
      console.error('Error in onLaunchToken:', error);
      toast.error(`Error preparing token launch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const deployToken = useCallback(async () => {
    try {
      if (!anchorWallet?.publicKey || !publicKey || !signTransaction) {
        toast.error("Please connect wallet!");
        return;
      }

      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const tokenATA = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey
      );

      const { curveConfig, feePool } = await getPDAs(
        anchorWallet?.publicKey,
        mintKeypair.publicKey,
        program
      );

      const accountInfo = await connection.getAccountInfo(curveConfig);
      if (accountInfo !== null) {
        toast.error("Configuration account already exists!");
        return;
      }

      // Check if mint account already exists
      const mintAccountInfo = await connection.getAccountInfo(mintKeypair.publicKey);
      if (mintAccountInfo !== null) {
        toast.error('Mint account already exists!');
        return;
      }

      // Upload metadata to Pinata
      const metadataUri = await uploadMetadataToPinata({
        name: basicInfo.name,
        symbol: basicInfo.symbol,
        description: basicInfo.description || "",
        image: basicInfo.avatarUrl || "",
        banner: basicInfo.bannerUrl || ""
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

      const curveConfigIns = await onLaunchToken(feePool, curveConfig);

      if (!curveConfigIns) {
        toast.error("Failed to prepare token launch configuration!");
        return;
      }

      const createNewTokenTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          Number(basicInfo.decimals),
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenATA,
          publicKey,
          mintKeypair.publicKey
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenATA,
          publicKey,
          Number(basicInfo.supply) * Math.pow(10, Number(basicInfo.decimals))
        ),
        metadataInstruction
      );

      if (adminSetup.revokeMintAuthority.isEnabled) {
        // Validate mint authority wallet address
        if (!adminSetup.revokeMintAuthority.walletAddress || !adminSetup.revokeMintAuthority.walletAddress.trim()) {
          toast.error("Mint authority wallet address is required when revoke mint authority is enabled!");
          return;
        }
        try {
          new PublicKey(adminSetup.revokeMintAuthority.walletAddress);
        } catch (error) {
          toast.error("Invalid mint authority wallet address!");
          return;
        }
        
        createNewTokenTransaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.MintTokens,
            new PublicKey(adminSetup.revokeMintAuthority.walletAddress)
          )
        );
      }

      if (adminSetup.revokeFreezeAuthority.isEnabled) {
        // Validate freeze authority wallet address
        if (!adminSetup.revokeFreezeAuthority.walletAddress || !adminSetup.revokeFreezeAuthority.walletAddress.trim()) {
          toast.error("Freeze authority wallet address is required when revoke freeze authority is enabled!");
          return;
        }
        try {
          new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress);
        } catch (error) {
          toast.error("Invalid freeze authority wallet address!");
          return;
        }
        
        createNewTokenTransaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.FreezeAccount,
            new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress)
          )
        );
      }

      createNewTokenTransaction.add(curveConfigIns as TransactionInstruction);

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      createNewTokenTransaction.recentBlockhash = blockhash;
      createNewTokenTransaction.feePayer = publicKey;

      // Sign with mintKeypair
      createNewTokenTransaction.partialSign(mintKeypair);

      // Sign with wallet
      const signedTx = await signTransaction(createNewTokenTransaction);

      // Send raw transaction
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);
      return txid;
    } catch (error) {
      console.error('Deploy token error:', error);
      throw error; // Re-throw the error so the calling component can handle it
    }
  }, [publicKey, connection, signTransaction, sendTransaction, basicInfo, allocation, dexListing, adminSetup, saleSetup]);

  return { deployToken };
};