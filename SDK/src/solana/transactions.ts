import { Transaction, TransactionSignature } from "@solana/web3.js";
import { CONFIRMATION_OPTIONS } from './constants';
import { logger } from './logger';
import { Wallet } from './types';
import { connection } from './utils';


export const confirmTransactionWithRetry = async (
  signature: TransactionSignature,
  maxRetries: number = 3
): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connection.confirmTransaction(signature, CONFIRMATION_OPTIONS.commitment);
      logger.debug("Transaction confirmed successfully", { signature, attempt: i + 1 });
      return;
    } catch (error) {
      logger.warn("Transaction confirmation attempt failed", {
        signature,
        attempt: i + 1,
        error: error instanceof Error ? error.message : String(error)
      });

      if (i === maxRetries - 1) {
        throw new Error(`Failed to confirm transaction after ${maxRetries} attempts: ${error}`);
      }

      // Exponential backoff
      const delayMs = 2000 * (i + 1);
      logger.debug("Retrying transaction confirmation", { signature, delayMs });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

export const sendAndConfirmTransactionWithRetry = async (
  transaction: Transaction,
  wallet: Wallet,
  maxRetries: number = 3
): Promise<TransactionSignature> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      logger.debug("Attempting to send transaction", {
        attempt: i + 1,
        maxRetries,
        wallet: wallet.publicKey.toBase58()
      });

      // Get fresh blockhash for each attempt
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
        CONFIRMATION_OPTIONS.commitment
      );
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send the transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: CONFIRMATION_OPTIONS.commitment,
          maxRetries: 2
        }
      );

      logger.debug("Transaction sent, confirming", { signature, attempt: i + 1 });

      // Confirm the transaction with shorter retry count to fail fast
      await confirmTransactionWithRetry(signature, 2);

      logger.info("Transaction sent and confirmed successfully", {
        signature,
        attempt: i + 1,
        wallet: wallet.publicKey.toBase58()
      });

      return signature;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn("Transaction send attempt failed", {
        attempt: i + 1,
        maxRetries,
        wallet: wallet.publicKey.toBase58(),
        error: lastError.message
      });

      if (i === maxRetries - 1) {
        break;
      }

      // Progressive delay between retries
      const delayMs = 1000 * (i + 1);
      logger.debug("Retrying transaction send", { delayMs, nextAttempt: i + 2 });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Failed to send transaction after all retries");
};

export const getTransactionStatus = async (
  signature: TransactionSignature
): Promise<'success' | 'error' | 'pending'> => {
  try {
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true
    });

    if (!status.value) {
      return 'pending';
    }

    if (status.value.err) {
      return 'error';
    }

    if (status.value.confirmationStatus === 'confirmed' ||
      status.value.confirmationStatus === 'finalized') {
      return 'success';
    }

    return 'pending';
  } catch (error) {
    logger.error("Error getting transaction status", {
      signature,
      error: error instanceof Error ? error.message : String(error)
    });
    return 'error';
  }
};

export const waitForTransactionConfirmation = async (
  signature: TransactionSignature,
  timeout: number = 30000
): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getTransactionStatus(signature);

    if (status === 'success') {
      return true;
    }

    if (status === 'error') {
      return false;
    }

    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.warn("Transaction confirmation timeout", { signature, timeout });
  return false;
};
