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
} from "@solana/spl-token";
import useAnchorProvider from "./useAnchorProvider";
import { getPDAs } from "../utils/sol";
import toast from "react-hot-toast";

export const useTokenTrading = () => {
  const { connection, program } = useAnchorProvider();
  const anchorWallet = useAnchorWallet();

  const buyToken = useCallback(
    async (
      mint: PublicKey,
      amount: number,
      admin?: PublicKey,
      feeRecipient?: PublicKey,
      feeRecipient2?: PublicKey,
      multisig?: PublicKey
    ) => {
      if (!anchorWallet?.publicKey || !connection || !program) {
        throw new Error("Required dependencies not available");
      }

      try {
        console.log("Before Buy from the pool with SPL token");
        
        const adminKey = admin || new PublicKey("Yo8A62FyZT4goufRRhDU6ENy3pLSVWEgFxe2SQhn5u6");
        const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount } = 
          await getPDAs(adminKey, mint, program);
        
        console.log("curveConfig", curveConfig.toBase58());
        console.log("bondingCurve", bondingCurve.toBase58());
        console.log("poolSolVault", poolSolVault.toBase58());
        console.log("poolTokenAccount", poolTokenAccount.toBase58());
        console.log("userTokenAccount", userTokenAccount.toBase58());

        const userBalanceBefore = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount;
        console.log("User Balance Before Buy: ", userBalanceBefore);

        const poolBalanceBefore = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount;
        console.log("Pool Balance Before Buy: ", poolBalanceBefore);

        if (feeRecipient) {
          const feeRecipientBalanceBefore = (await connection.getBalance(feeRecipient));
          console.log("Fee Recipient Balance Before Buy: ", feeRecipientBalanceBefore);
        }

        if (feeRecipient2) {
          const feeRecipient2BalanceBefore = (await connection.getBalance(feeRecipient2));
          console.log("Fee Recipient 2 Balance Before Buy: ", feeRecipient2BalanceBefore);
        }

        if (multisig) {
          const multisigBalanceBefore = (await connection.getBalance(multisig));
          console.log("Multisig Balance Before Buy: ", multisigBalanceBefore);
        }

        const tx = new Transaction().add(
          await program.methods
            .buy(new BN(amount))
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
              systemProgram: SystemProgram.programId,
            })
            .instruction()
        );

        tx.feePayer = anchorWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        
        const signedTx = await anchorWallet.signTransaction(tx);
        const rawTx = signedTx.serialize();
        const sig = await connection.sendRawTransaction(rawTx);
        await connection.confirmTransaction(sig);
        
        console.log("Successfully buy : ", `https://solscan.io/tx/${sig}?cluster=devnet`);
        
        const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount;
        const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount;
        console.log("User Balance After Buy: ", userBalance);
        console.log("Pool Balance After Buy: ", poolBalance);

        if (feeRecipient) {
          const feeRecipientBalanceAfter = (await connection.getBalance(feeRecipient));
          console.log("Fee Recipient Balance After Buy: ", feeRecipientBalanceAfter);
        }
        
        if (feeRecipient2) {
          const feeRecipient2BalanceAfter = (await connection.getBalance(feeRecipient2));
          console.log("Fee Recipient 2 Balance After Buy: ", feeRecipient2BalanceAfter);
        }
        
        if (multisig) {
          const multisigBalanceAfter = (await connection.getBalance(multisig));
          console.log("Multisig Balance After Buy : ", multisigBalanceAfter);
        }

        toast.success("Token purchased successfully!");
        return sig;

      } catch (error) {
        console.log("Error in buy from pool :", error);
        toast.error("Failed to buy token");
        throw error;
      }
    },
    [anchorWallet, connection, program]
  );

  const sellToken = useCallback(
    async (
      mint: PublicKey,
      amount: typeof BN,
      admin?: PublicKey,
      feeRecipient?: PublicKey,
      feeRecipient2?: PublicKey,
      multisig?: PublicKey
    ) => {
      if (!anchorWallet?.publicKey || !connection || !program) {
        throw new Error("Required dependencies not available");
      }

      try {
        console.log("Before Sell from the pool with SPL token");
        
        const adminKey = admin || anchorWallet.publicKey;
        const { curveConfig, bondingCurve, poolSolVault, poolTokenAccount, userTokenAccount, poolSolVaultBump } = 
          await getPDAs(adminKey, mint, program);

        const userBalanceBefore = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount;
        console.log("User Balance Before Sell: ", userBalanceBefore);

        const poolBalanceBefore = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount;
        console.log("Pool Balance Before Sell: ", poolBalanceBefore);

        if (feeRecipient) {
          const feeRecipientBalanceBefore = (await connection.getBalance(feeRecipient));
          console.log("Fee Recipient Balance Before Sell: ", feeRecipientBalanceBefore);
        }

        if (feeRecipient2) {
          const feeRecipient2BalanceBefore = (await connection.getBalance(feeRecipient2));
          console.log("Fee Recipient 2 Balance Before Sell: ", feeRecipient2BalanceBefore);
        }

        if (multisig) {
          const multisigBalanceBefore = (await connection.getBalance(multisig));
          console.log("Multisig Balance Before Sell: ", multisigBalanceBefore);
        }

        const tx = new Transaction().add(
          await program.methods
            .sell(amount, poolSolVaultBump)
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
              systemProgram: SystemProgram.programId,
            })
            .instruction()
        );

        tx.feePayer = anchorWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        
        const signedTx = await anchorWallet.signTransaction(tx);
        const rawTx = signedTx.serialize();
        const sig = await connection.sendRawTransaction(rawTx);
        await connection.confirmTransaction(sig);
        
        console.log("Successfully sell : ", `https://solscan.io/tx/${sig}?cluster=devnet`);
        
        const userBalance = (await connection.getTokenAccountBalance(userTokenAccount)).value.uiAmount;
        const poolBalance = (await connection.getTokenAccountBalance(poolTokenAccount)).value.uiAmount;
        console.log("User Balance After Sell: ", userBalance);
        console.log("Pool Balance After Sell: ", poolBalance);

        if (feeRecipient) {
          const feeRecipientBalanceAfter = (await connection.getBalance(feeRecipient));
          console.log("Fee Recipient Balance After Sell: ", feeRecipientBalanceAfter);
        }
        
        if (feeRecipient2) {
          const feeRecipient2BalanceAfter = (await connection.getBalance(feeRecipient2));
          console.log("Fee Recipient 2 Balance After Sell: ", feeRecipient2BalanceAfter);
        }
        
        if (multisig) {
          const multisigBalanceAfter = (await connection.getBalance(multisig));
          console.log("Multisig Balance After Sell : ", multisigBalanceAfter);
        }

        toast.success("Token sold successfully!");
        return sig;

      } catch (error) {
        console.log("Error in sell from pool :", error);
        toast.error("Failed to sell token");
        throw error;
      }
    },
    [anchorWallet, connection, program]
  );

  return {
    buyToken,
    sellToken,
  };
}; 