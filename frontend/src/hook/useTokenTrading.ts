import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import useAnchorProvider from "./useAnchorProvider";
import { getPDAs } from "../utils/sol";
import toast from "react-hot-toast";

export const useTokenTrading = () => {
  const provider = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const buyToken = useCallback(
    async (
      mint: PublicKey,
      amount: number,
      admin: PublicKey,
      tokenName: string
    ) => {
      if (!anchorWallet?.publicKey || !provider?.connection || !provider?.program) {
        throw new Error("Required dependencies not available");
      }

      let tx = new Transaction()

      try {
        const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } = getPDAs(admin, mint)

        const associatedTokenAddress = await getAssociatedTokenAddress(mint, anchorWallet.publicKey);
        try {
            const accountInfo = await provider.connection.getAccountInfo(associatedTokenAddress);
            if (!accountInfo) {
              tx.add(createAssociatedTokenAccountInstruction(
                anchorWallet.publicKey, associatedTokenAddress, anchorWallet.publicKey, mint
              ));
            }
        } catch (error) {
          console.log("error in getAssociatedTokenAddress")
        }
            
        tx.add(await provider.program.methods.buy(new BN(amount))
            .accountsStrict({              
              bondingCurveConfiguration: curveConfig,
              bondingCurveAccount: bondingCurve,              
              tokenMint: mint,
              tokenProgram: TOKEN_PROGRAM_ID,              
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              poolSolVault: poolSolVault,              
              poolTokenAccount: poolTokenAccount,
              userTokenAccount: userTokenAccount,
              user: anchorWallet.publicKey,
              systemProgram: SystemProgram.programId
            })
            .instruction()
        );

        tx.feePayer = anchorWallet.publicKey;
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        
        const signedTx = await anchorWallet.signTransaction(tx);
        const rawTx = signedTx.serialize();
        const sig = await provider.connection.sendRawTransaction(rawTx);
        await provider.connection.confirmTransaction(sig);
        
        console.log("Successfully buy : ", `https://solscan.io/tx/${sig}?cluster=devnet`);
        

        toast.success(`Buy ${tokenName} successfully!`);
        return sig;

      } catch (error) {
        console.log("Error in buy from pool :", error);
        toast.error("Failed to buy token");
        throw error;
      }
    },
    [anchorWallet, provider]
  );

  const sellToken = useCallback(
    async (
      mint: PublicKey,
      amount: number,
      admin: PublicKey,
      tokenName: string,
      feeRecipients?: PublicKey[]
    ) => {
      if (!anchorWallet?.publicKey || !provider?.connection || !provider?.program) {
        throw new Error("Required dependencies not available");
      }

      try {
        const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump } = getPDAs(admin, mint)

        const tx = new Transaction()
          .add(
            await provider.program.methods
              .sell(new BN(amount), poolSolVaultBump)
              .accountsStrict({
                bondingCurveConfiguration: curveConfig,
                bondingCurveAccount: bondingCurve,
                tokenMint: mint,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                poolSolVault: poolSolVault,
                poolTokenAccount: poolTokenAccount,
                userTokenAccount: userTokenAccount,
                user: anchorWallet.publicKey,
                systemProgram: SystemProgram.programId
              })
              .remainingAccounts(
                feeRecipients ? feeRecipients.map(recipient => ({
                  pubkey: recipient,
                  isWritable: true,
                  isSigner: false,
                })) : []
              )
              .instruction()
          );

        tx.feePayer = anchorWallet.publicKey;
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        
        const signedTx = await anchorWallet.signTransaction(tx);
        const rawTx = signedTx.serialize();
        const sig = await provider.connection.sendRawTransaction(rawTx);
        await provider.connection.confirmTransaction(sig);
        
        console.log("Successfully sell : ", `https://solscan.io/tx/${sig}?cluster=devnet`);

        toast.success(`Sell ${tokenName} successfully!`);
        return sig;

      } catch (error) {
        console.log("Error in sell from pool :", error);
        toast.error("Failed to sell token");
        throw error;
      }
    },
    [anchorWallet, provider]
  );

  return {
    buyToken,
    sellToken
  };
}; 