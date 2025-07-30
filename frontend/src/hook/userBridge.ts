import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  getClient, 
  ChainKind, 
  omniAddress,
  OmniBridgeAPI,
  type Transfer,
  type Chain
} from 'omni-bridge-sdk';
import toast from 'react-hot-toast';
import { SOL_NETWORK } from '../configs/env.config';

export const useBridge = () => {
  const { publicKey, wallet } = useWallet();
  const [isBridging, setIsBridging] = useState(false);

  // Helper function to get Solana provider
  const getSolanaProvider = useCallback(() => {
    if (!wallet || !publicKey) return null;
    
    // Create connection based on environment configuration
    const connection = new Connection(
      SOL_NETWORK === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com'
    );

    // Return a provider-like object that matches the SDK expectations
    return {
      connection,
      publicKey,
      wallet,
    };
  }, [wallet, publicKey]);

  // Bridge from Solana to NEAR
  const bridgeSolanaToNear = useCallback(async (
    tokenMint: string,
    amount: bigint,
    recipientNearAccount: string
  ) => {
    if (!publicKey || !wallet) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    try {
      setIsBridging(true);

      const provider = getSolanaProvider();
      if (!provider) {
        throw new Error('Failed to create Solana provider');
      }

      // Create Solana client
      const solanaClient = getClient(ChainKind.Sol, provider);

      // Initialize API with testnet endpoint for devnet transfers
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });

      const sender = omniAddress(ChainKind.Sol, publicKey.toBase58());
      const recipient = omniAddress(ChainKind.Near, recipientNearAccount);
      const tokenAddress = omniAddress(ChainKind.Sol, tokenMint);

      // Get fee estimation
      const fee = await api.getFee(sender as any, recipient as any, tokenAddress as any);

      // Initiate transfer
      const rawTransferEvent = await solanaClient.initTransfer({
        amount,
        fee: fee.transferred_token_fee ?? 0n,
        nativeFee: fee.native_token_fee ?? 0n,
        recipient,
        tokenAddress,
      });

      console.log('[transferEvent]', rawTransferEvent);
      
      if (!rawTransferEvent) {
        throw new Error('Failed to initiate transfer');
      }

      // Handle transfer result
      if (typeof rawTransferEvent === 'string') {
        // Wait for transaction to be indexed
        let data: Transfer | undefined;
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            const transfers = await api.findOmniTransfers({
              transaction_id: rawTransferEvent,
            });
            if (transfers.length > 0) {
              data = await api.getTransfer(
                transfers[0].id.origin_chain,
                transfers[0].id.origin_nonce,
              );
              break;
            }
          } catch (err) {
            console.error('Failed to fetch transfer:', err);
            continue;
          }
        }

        if (!data) {
          throw new Error('Failed to fetch transfer data after multiple retries');
        }

        toast.success(`Bridge initiated! Transaction: ${rawTransferEvent}`);
        return data;
      } else {
        // Handle non-string transfer events
        let data: Transfer | undefined;
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            data = await api.getTransfer(
              'Sol' as Chain,
              (rawTransferEvent as any).transfer_message?.origin_nonce || '',
            );
            if (data) break;
          } catch (err) {
            console.error('Failed to fetch transfer:', err);
            continue;
          }
        }

        if (!data) {
          throw new Error('Failed to fetch transfer data after multiple retries');
        }

        toast.success('Bridge initiated successfully!');
        return data;
      }
    } catch (error) {
      console.error('Bridge error:', error);
      toast.error(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsBridging(false);
    }
  }, [publicKey, wallet, getSolanaProvider]);

  // Bridge from NEAR to Solana
  const bridgeNearToSolana = useCallback(async (
    tokenContract: string,
    amount: bigint,
    recipientSolanaAddress: string,
    nearAccountId: string,
    nearSelector: any // NEAR Wallet Selector
  ) => {
    if (!nearAccountId || !nearSelector) {
      toast.error('Please connect your NEAR wallet first');
      return;
    }

    try {
      setIsBridging(true);

      // Create NEAR client
      const nearClient = getClient(ChainKind.Near, nearSelector);

      // Initialize API with testnet endpoint for testnet transfers
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });

      const sender = omniAddress(ChainKind.Near, nearAccountId);
      const recipient = omniAddress(ChainKind.Sol, recipientSolanaAddress);
      const tokenAddress = omniAddress(ChainKind.Near, tokenContract);

      // Get fee estimation
      const fee = await api.getFee(sender as any, recipient as any, tokenAddress as any);

      // Initiate transfer
      const rawTransferEvent = await nearClient.initTransfer({
        amount,
        fee: fee.transferred_token_fee ?? 0n,
        nativeFee: fee.native_token_fee ?? 0n,
        recipient,
        tokenAddress,
      });

      console.log('[transferEvent]', rawTransferEvent);
      
      if (!rawTransferEvent) {
        throw new Error('Failed to initiate transfer');
      }

      // Handle transfer result
      if (typeof rawTransferEvent === 'string') {
        // Wait for transaction to be indexed
        let data: Transfer | undefined;
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            const transfers = await api.findOmniTransfers({
              transaction_id: rawTransferEvent,
            });
            if (transfers.length > 0) {
              data = await api.getTransfer(
                transfers[0].id.origin_chain,
                transfers[0].id.origin_nonce,
              );
              break;
            }
          } catch (err) {
            console.error('Failed to fetch transfer:', err);
            continue;
          }
        }

        if (!data) {
          throw new Error('Failed to fetch transfer data after multiple retries');
        }

        toast.success(`Bridge initiated! Transaction: ${rawTransferEvent}`);
        return data;
      } else {
        // Handle non-string transfer events
        let data: Transfer | undefined;
        for (let i = 0; i < 20; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            data = await api.getTransfer(
              'Near' as Chain,
              (rawTransferEvent as any).transfer_message?.origin_nonce || '',
            );
            if (data) break;
          } catch (err) {
            console.error('Failed to fetch transfer:', err);
            continue;
          }
        }

        if (!data) {
          throw new Error('Failed to fetch transfer data after multiple retries');
        }

        toast.success('Bridge initiated successfully!');
        return data;
      }
    } catch (error) {
      console.error('Bridge error:', error);
      toast.error(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsBridging(false);
    }
  }, []);

  // Get transfer status
  const getTransferStatus = useCallback(async (chain: Chain, nonce: string) => {
    try {
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });
      const status = await api.getTransferStatus(chain, nonce as any);
      return status;
    } catch (error) {
      console.error('Error getting transfer status:', error);
      throw error;
    }
  }, []);

  // Get transfer history
  const getTransferHistory = useCallback(async (senderAddress: string, limit: number = 50) => {
    try {
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });
      const transfers = await api.findOmniTransfers({
        sender: senderAddress,
        limit,
      });
      return transfers;
    } catch (error) {
      console.error('Error getting transfer history:', error);
      throw error;
    }
  }, []);

  // Get fee estimation
  const getFeeEstimation = useCallback(async (
    sender: string,
    recipient: string,
    tokenAddress: string
  ) => {
    try {
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });
      const fee = await api.getFee(sender as any, recipient as any, tokenAddress as any);
      return fee;
    } catch (error) {
      console.error('Error getting fee estimation:', error);
      throw error;
    }
  }, []);

  return {
    bridgeSolanaToNear,
    bridgeNearToSolana,
    getTransferStatus,
    getTransferHistory,
    getFeeEstimation,
    isBridging,
  };
}; 