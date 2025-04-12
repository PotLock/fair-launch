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
import { useTokenDeployer } from "../context/TokenDeployerContext";
import useAnchorProvider from "./useAnchorProvider";
import { getPDAs } from "../utils/sol";

export const useDeployToken = () => {
  const { state } = useTokenDeployer();
  const walletSol = useWallet();
  const { publicKey, sendTransaction, signTransaction } = walletSol;
  const { anchorWallet, program, governanceKeypair, connection, mintKeypair } = useAnchorProvider();

  const onLaunchToken = (
    feePool: PublicKey,
    curveConfig: PublicKey
  ) => {
    if (!anchorWallet?.publicKey || !publicKey) {
      toast.error("⚠️ Wallet is not ready! Please connect wallet.");
      return;
    }

    const feePercentage = new BN(100);
    const initialQuorum = new BN(500);
    const daoQuorum = new BN(500);
    const bondingCurveType = 1;
    const maxTokenSupply = new BN(10000000000);

    const recipients = state.allocation.data.map((item) => ({
      share: item.percentage * 100,
      address: new PublicKey(item.walletAddress),
      lockingPeriod: new BN(item.lockupPeriod),
      amount: new BN(0),
    }));

    return program.methods
      .initialize(
        initialQuorum,
        feePercentage,
        new BN(state.bondingCurve.data.targetPrice),
        governanceKeypair.publicKey,
        daoQuorum,
        bondingCurveType,
        maxTokenSupply,
        new BN(state.liquidity.data.liquidityLockupPeriod),
        new BN(state.liquidity.data.liquidityPercentage),
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
  };

  const deployToken = useCallback(async () => {
    try {
      if (!anchorWallet?.publicKey || !publicKey || !signTransaction) {
        toast.error("⚠️ Wallet is not ready!");
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
        toast.error("⚠️ Configuration account already exists!");
        return;
      }

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
              name: state.basicInfo.data.name,
              symbol: state.basicInfo.data.symbol,
              uri: state.basicInfo.data.logo ? URL.createObjectURL(state.basicInfo.data.logo) : "",
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
          Number(state.basicInfo.data.decimals),
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
          Number(state.basicInfo.data.supply) * Math.pow(10, Number(state.basicInfo.data.decimals))
        ),
        metadataInstruction
      );

      if (state.basicInfo.data.revokeMintEnabled) {
        createNewTokenTransaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.MintTokens,
            publicKey // You may want to add a field for this in your context
          )
        );
      }

      if (state.basicInfo.data.revokeFreezeEnabled) {
        createNewTokenTransaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.FreezeAccount,
            publicKey // You may want to add a field for this in your context
          )
        );
      }

      createNewTokenTransaction.add(curveConfigIns as TransactionInstruction);

      const result = await sendTransaction(
        createNewTokenTransaction,
        connection,
        { signers: [mintKeypair] }
      );

      toast.success(`🚀 Created token ${state.basicInfo.data.name} Successfully!`);
      return result;
    } catch (error) {
      toast.error(`Create token failed!`);
      console.error("Deploy token error:", error);
    }
  }, [publicKey, connection, signTransaction, sendTransaction, state]);

  return { deployToken };
};
