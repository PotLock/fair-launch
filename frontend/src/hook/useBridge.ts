import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import {  
  ChainKind, 
  omniAddress,
  OmniBridgeAPI,
  omniTransfer,
  getVaa,
  setNetwork,
  type Transfer,
  type Chain
} from 'omni-bridge-sdk';
import toast from 'react-hot-toast';
import { SOL_NETWORK } from '../configs/env.config';
import { initTransfer, logMetadata, isBridgedToken, deployToken } from '../utils/omniBrigde';
import useAnchorProvider from './useAnchorProvider';

// Interface for token info including balance
interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: bigint;
  totalSupply?: bigint;
}

// Supported tokens configuration
const SUPPORTED_TOKENS = {
  NEAR: {
    symbol: 'NEAR',
    addresses: {
      near: 'wrap.testnet', // Wrapped NEAR on testnet
      solana: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    },
    decimals: {
      near: 24,
      solana: 9,
    },
    icon: '/near-logo.webp',
  },
  USDC: {
    symbol: 'USDC',
    addresses: {
      near: 'usdc.fakes.testnet', // USDC on NEAR testnet
      solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana devnet
    },
    decimals: {
      near: 6,
      solana: 6,
    },
    icon: '/usdc-icon.png',
  },
};

export const useBridge = () => {
  const { publicKey, sendTransaction, connected, wallet, signTransaction } = useWallet();
  const [isBridging, setIsBridging] = useState(false);
  const anchorProvider = useAnchorProvider()

  // Helper function to check wallet network and provide debugging info
  const checkWalletNetwork = useCallback(async () => {
    if (!publicKey || !connected) {
      return { isValid: false, message: 'Wallet not connected' };
    }

    try {
      const connection = new Connection(
        SOL_NETWORK === 'mainnet-beta' 
          ? 'https://api.mainnet-beta.solana.com'
          : 'https://api.devnet.solana.com'
      );
      
      const balance = await connection.getBalance(publicKey);
      const expectedNetwork = SOL_NETWORK || 'devnet';
      
      return {
        isValid: true,
        balance: balance / 1e9,
        network: expectedNetwork,
        hasFunds: balance > 0.001 * 1e9
      };
    } catch (error) {
      console.error('Error checking wallet network:', error);
      return { 
        isValid: false, 
        message: 'Could not verify wallet network. Please ensure your wallet is connected to the correct network.' 
      };
    }
  }, [publicKey, connected, wallet]);

  // Log token metadata using Omni Bridge SDK
  const handleLogMetadata = useCallback(async (
    tokenMint: string
  ): Promise<string | null> => {
    if (!publicKey || !sendTransaction || !connected) {
      toast.error('Please connect your Solana wallet first');
      return null;
    }

    try {
      const formattedTokenAddress = omniAddress(ChainKind.Sol, tokenMint);
      try {        
        const txHash = await logMetadata(formattedTokenAddress, anchorProvider?.program as any);
        console.log(`✅ Metadata logged with tx: ${txHash}`);
        
        toast.success(`Token metadata logged successfully! Transaction: ${txHash}`);
        return txHash;
      } catch (sdkError) {
        console.error('❌ SDK error in logMetadata:', sdkError);
        
        // If the SDK fails, try a different approach or provide more specific error
        if (sdkError instanceof Error) {
          // Check if it's a wallet-related error
          if (sdkError.message.includes('WalletSendTransactionError') || 
              sdkError.message.includes('Unexpected error')) {
            throw new Error('Wallet transaction failed. Please check your wallet connection and try again.');
          }
          throw new Error(`SDK Error: ${sdkError.message}`);
        } else {
          throw new Error('Unknown SDK error occurred');
        }
      }
    } catch (error) {
      console.error('❌ Failed to log token metadata:', error);
      toast.error(`Failed to log token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [publicKey, sendTransaction, connected, wallet]);

  // Get token info including balance
  const getTokenInfo = useCallback(async (tokenMint: string): Promise<TokenInfo | null> => {
    if (!publicKey) {
      toast.error('Please connect your Solana wallet first');
      return null;
    }

    try {
      const connection = new Connection(
        SOL_NETWORK === 'mainnet-beta' 
          ? 'https://api.mainnet-beta.solana.com'
          : 'https://api.devnet.solana.com'
      );

      // Get token mint info
      const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMint));
      
      if (!mintInfo.value) {
        throw new Error('Token mint not found');
      }

      const mintData = (mintInfo.value.data as any).parsed.info;
      const decimals = mintData.decimals;
      const supply = mintData.supply;

      // Try to get metadata
      let name = `Token ${tokenMint.slice(0, 8)}`;
      let symbol = 'TKN';

      try {
        const metadataAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
            new PublicKey(tokenMint).toBuffer(),
          ],
          new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        )[0];

        const metadataAccount = await connection.getAccountInfo(metadataAddress);
        
        if (metadataAccount) {
          // Parse metadata (simplified - you might want to use a proper metadata parser)
          name = `Token ${tokenMint.slice(0, 8)}`;
          symbol = 'TKN';
        }
      } catch (error) {
        console.error('Failed to get metadata:', error);
      }

      // Get token balance for the connected wallet
      let balance = BigInt(0);
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(tokenMint) }
        );

        if (tokenAccounts.value.length > 0) {
          const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
          balance = BigInt(accountInfo.tokenAmount.amount);
        }
      } catch (error) {
        console.error('Failed to get token balance:', error);
      }

      return {
        mint: tokenMint,
        name,
        symbol,
        decimals,
        balance,
        totalSupply: BigInt(supply),
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [publicKey]);

  // Bridge from Solana to NEAR
  const bridgeSolanaToNear = useCallback(async (
    tokenMint: string,
    amount: bigint,
    recipientNearAccount: string
  ) => {
    if (!publicKey || !sendTransaction || !connected) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    try {
      setIsBridging(true);

      // 1. Set network type
      setNetwork("testnet");

      // 3. Initialize API
      const api = new OmniBridgeAPI({
        baseUrl: 'https://testnet.api.bridge.nearone.org',
      });

      // 4. Create addresses
      const recipient = omniAddress(ChainKind.Near, recipientNearAccount) as any;
      const tokenAddress = omniAddress(ChainKind.Sol, tokenMint) as any;

      // 7. Create transfer object
      // tokenAddress: OmniAddress
      // amount: bigint
      // fee: bigint
      // nativeFee: bigint
      // recipient: OmniAddress
      // message?: string

      console.log("amount", amount)
      const transfer = {
        tokenAddress,
        amount,
        fee: BigInt(1000),
        nativeFee: BigInt(1000),
        recipient,
      };


      // 8. Send tokens using omniTransfer
      const result = await omniTransfer(anchorProvider?.program as any,transfer)
      console.log('[transferEvent]', result);

      if (!result) {
        throw new Error('Failed to initiate transfer');
      }

      // 9. Get Wormhole VAA (returns hex-encoded string) for Solana->NEAR
      let vaa: string | undefined;
      if (typeof result === 'string') {
        // If result is a transaction hash, get VAA
        vaa = await getVaa(result, "Testnet");
        console.log('Wormhole VAA:', vaa);
      }

      // 10. Monitor status
      let transferData: Transfer | undefined;
      const maxRetries = 20;
      const retryDelay = 3000; // 3 seconds

      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        try {
          if (typeof result === 'string') {
            // Wait for transaction to be indexed
            const transfers = await api.findOmniTransfers({
              transaction_id: result,
            });
            if (transfers.length > 0) {
              transferData = await api.getTransfer(
                transfers[0].id.origin_chain,
                transfers[0].id.origin_nonce,
              );
              break;
            }
          } else {
            // Handle non-string transfer events
            transferData = await api.getTransfer(
              'Sol' as Chain,
              (result as any).transfer_message?.origin_nonce || '',
            );
            if (transferData) break;
          }
        } catch (err) {
          console.error(`Failed to fetch transfer (attempt ${i + 1}/${maxRetries}):`, err);
          continue;
        }
      }

      if (!transferData) {
        throw new Error('Failed to fetch transfer data after multiple retries');
      }

      // 11. Get transfer status
      const status = await api.getTransferStatus(
        transferData.id.origin_chain as Chain,
        transferData.id.origin_nonce
      );
      console.log(`Transfer status: ${status}`);

      toast.success(`Bridge initiated successfully! Transaction: ${typeof result === 'string' ? result : 'Completed'}`);
      return {
        transferData,
        status,
        vaa,
        transactionHash: typeof result === 'string' ? result : undefined,
      };
    } catch (error) {
      console.error('Bridge error:', error);
      toast.error(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsBridging(false);
    }
  }, [publicKey, sendTransaction, connected, getTokenInfo, logMetadata]);

  // Check if token is registered with bridge
  const isTokenRegistered = useCallback(async (
    token: string
  ): Promise<boolean> => {
    try {
      const isBridged = await isBridgedToken(new PublicKey(token), anchorProvider?.program as any)
      return isBridged
    } catch (error) {
      console.error('Error checking token registration:', error);
      return false;
    }
  }, [anchorProvider]);

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

      const senderAddress = omniAddress(ChainKind.Sol, sender)
      const recipientAddress = omniAddress(ChainKind.Near, recipient)
      const tokenAddressSol = omniAddress(ChainKind.Sol, tokenAddress)

      const fee = await api.getFee(senderAddress, recipientAddress, tokenAddressSol);
      return fee;
    } catch (error) {
      console.error('Error getting fee estimation:', error);
      throw error;
    }
  }, []);

  return {
    bridgeSolanaToNear,
    handleLogMetadata,
    getTokenInfo,
    getFeeEstimation,
    isTokenRegistered,
    isBridging,
    checkWalletNetwork,
    SUPPORTED_TOKENS,
  };
}; 