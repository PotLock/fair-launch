import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {  
  ChainKind, 
  omniAddress,
  OmniBridgeAPI,
  omniTransfer,
  getVaa,
  setNetwork,
  type Transfer,
  type Chain,
  SolanaBridgeClient
} from 'omni-bridge-sdk';
import toast from 'react-hot-toast';
import { SOL_NETWORK, SOL_PRIVATE_KEY } from '../configs/env.config';
import { logMetadata, isBridgedToken, lockerAddress } from '../lib/omniBrigde';
import useAnchorProvider from './useAnchorProvider';
import { NearWalletSelectorBridgeClient } from 'omni-bridge-sdk/dist/src/clients/near-wallet-selector';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

// Interface for token info including balance
interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: bigint;
  totalSupply?: bigint;
}

export const useBridge = () => {
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const [isBridging, setIsBridging] = useState(false);
  const anchorProvider = useAnchorProvider()
  const { walletSelector: nearWalletSelector } = useWalletSelector()

  // Log token metadata using Omni Bridge SDK
  const handleLogMetadata = useCallback(async (
    tokenMint: string,
    waitForCompletion: boolean = false
  ): Promise<string | { txHash: string; vaa?: string } | null> => {
    if (!publicKey || !sendTransaction || !connected) {
      toast.error('Please connect your Solana wallet first');
      return null;
    }

    if (!anchorProvider?.program) {
      toast.error('Anchor provider not available. Please ensure your wallet is connected.');
      return null;
    }

    try {
      const formattedTokenAddress = omniAddress(ChainKind.Sol, tokenMint);
      try {        
        console.log("Starting logMetadata...")
        const logTxHash = await logMetadata(formattedTokenAddress, anchorProvider.program as any)
        console.log("logMetadata txHash:", logTxHash)

        if (waitForCompletion) {
          // Wait for 1 minute (60 seconds) for logMetadata to complete on chain
          console.log("Waiting 60 seconds for logMetadata to complete on chain...")
          await new Promise(resolve => setTimeout(resolve, 60000)) // 60 seconds = 1 minute

          console.log("Getting VAA after logMetadata completion...")
          const vaa = await getVaa(logTxHash, "Testnet");
          console.log("VAA retrieved:", vaa)
          
          return { txHash: logTxHash, vaa }
        }

        return logTxHash

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

        if (metadataAccount && metadataAccount.data) {
          try {
            // Parse the metadata buffer
            const buffer = Buffer.from(metadataAccount.data);
            
            // Check if buffer is large enough for basic metadata
            if (buffer.length < 10) {
              throw new Error('Buffer too small for metadata');
            }
            
            // Try to find name and symbol by looking for readable strings
            const bufferString = buffer.toString('utf8');

            const parts = bufferString.split('\0').filter(part => {

            return part.length > 0 && 
                     part.length < 50 && 
                     /^[a-zA-Z0-9\s]+$/.test(part.trim()) &&
                     part.trim().length > 0;
            });

            
            if (parts.length >= 2) {
              // First readable string is likely the name
              name = parts[0].trim();
              // Second readable string is likely the symbol
              symbol = parts[1].trim();
              
              console.log("Parsed metadata:", { name, symbol });
            } else if (parts.length === 1) {
              // Only one readable string found, use it as name
              name = parts[0].trim();
              symbol = name.slice(0, 10).toUpperCase();
              console.log("Parsed metadata (single part):", { name, symbol });
            } else {
              // Fallback to default values
              name = `Token ${tokenMint.slice(0, 8)}`;
              symbol = 'TKN';
              console.log("Using fallback metadata:", { name, symbol });
            }
          } catch (error) {
            console.error('Error parsing metadata:', error);
            // Fallback to default values
            name = `Token ${tokenMint.slice(0, 8)}`;
            symbol = 'TKN';
          }
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
  const transferTokenSolanaToNear = useCallback(async (
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
      const senderAddress = omniAddress(ChainKind.Sol, publicKey.toString()) as any;
      const recipient = omniAddress(ChainKind.Near, recipientNearAccount) as any;
      const tokenAddress = omniAddress(ChainKind.Sol, tokenMint) as any;

      const fee = await api.getFee(senderAddress, recipient, tokenAddress);

      console.log("amount", amount)
      const transfer = {
        tokenAddress,
        amount,
        fee: fee.transferred_token_fee || BigInt(0),
        nativeFee: fee.native_token_fee || BigInt(0),
        recipient,
      };


      // 8. Send tokens using omniTransfer
      if (!anchorProvider?.providerProgram) {
        throw new Error('Anchor provider not available. Please ensure your wallet is connected.');
      }
      const result = await omniTransfer(anchorProvider.providerProgram as any,transfer)
      console.log('result', result);

      if (!result) {
        throw new Error('Failed to initiate transfer');
      }

      console.log("Waiting 60 seconds for logMetadata to complete on chain...")
      await new Promise(resolve => setTimeout(resolve, 80000))


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

      console.log('transferData', transferData)
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
    if (!anchorProvider?.programBridgeTokenFactory) {
      console.error('Anchor provider not available for token registration check');
      return false;
    }
    
    try {
      const isBridged = await isBridgedToken(new PublicKey(token), anchorProvider.programBridgeTokenFactory as any)
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
      console.log(fee)
      return fee;
    } catch (error) {
      console.error('Error getting fee estimation:', error);
      throw error;
    }
  }, []);

  const deployTokenNear = useCallback(async (
    tokenMint: string
  ) => {
    if (!anchorProvider?.providerProgram) {
      throw new Error('Anchor provider not available. Please ensure your wallet is connected.');
    }

    try{
      setNetwork("testnet");
      const secretKey = bs58.decode(SOL_PRIVATE_KEY || "");
      const payer = Keypair.fromSecretKey(secretKey);
      const mintAddress = omniAddress(ChainKind.Sol, tokenMint)
      console.log("Starting logMetadata...")
      console.log(anchorProvider.providerProgram)
      const solClient = new SolanaBridgeClient(anchorProvider.providerProgram as any)
      const txHash = await solClient.logMetadata(mintAddress, payer)
      console.log("logMetadata txHash:", txHash)

      console.log("Waiting 60 seconds for logMetadata to complete on chain...")
      await new Promise(resolve => setTimeout(resolve, 80000))

      console.log("Getting VAA after logMetadata completion...")
      const vaa = await getVaa(txHash, "Testnet");
      console.log("VAA retrieved:", vaa)
      const selector = await nearWalletSelector

      const nearClient = new NearWalletSelectorBridgeClient(selector as any, lockerAddress)

      const result = await nearClient.deployToken(ChainKind.Sol, vaa)
      console.log("Token deployed to NEAR:", result)
      
      return { vaa,result }
    } catch (error) {
      console.error('Error deploying token:', error);
      throw error;
    }
  }, [anchorProvider, nearWalletSelector])

  // Get VAA (Validators Approval Authority) from transaction hash
  const handleGetVaa = useCallback(async (
    transactionHash: string
  ): Promise<string | null> => {
    if (!transactionHash) {
      toast.error('Please enter a transaction hash');
      return null;
    }

    try {
      const vaa = await getVaa(transactionHash, "Testnet");
      console.log('VAA retrieved:', vaa);
      return vaa;
    } catch (error) {
      console.error('Error getting VAA:', error);
      toast.error(`Failed to get VAA: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, []);

  return {
    transferTokenSolanaToNear,
    handleLogMetadata,
    getTokenInfo,
    getFeeEstimation,
    isTokenRegistered,
    isBridging,
    deployTokenNear,
    handleGetVaa
  };
}; 