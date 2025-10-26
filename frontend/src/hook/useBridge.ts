import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import {  
  ChainKind, 
  omniAddress,
  OmniBridgeAPI,
  omniTransfer,
  getVaa,
  setNetwork,
  type Transfer,
  type Chain,
  SolanaBridgeClient,
  NetworkType,
  MPCSignature,
  EvmBridgeClient
} from 'omni-bridge-sdk';
import { SOL_PRIVATE_KEY } from '../configs/env.config';
import useAnchorProvider from './useAnchorProvider';
import { NearWalletSelectorBridgeClient } from 'omni-bridge-sdk/dist/src/clients/near-wallet-selector';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

export const useBridge = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const anchorProvider = useAnchorProvider()
  const { walletSelector: nearWalletSelector } = useWalletSelector()
  const { address: evmAddress, isConnected: evmConnected } = useAccount(); 
  const { data: walletClient } = useWalletClient();

  // Bridge from Solana to NEAR
  const transferToken = useCallback(async (
    network: NetworkType,
    fromChain: ChainKind,
    toChain: ChainKind,
    senderAddress: string,
    addressToken: string,
    amount: bigint,
    recipientAddress: string,
    onProgress?: (progress: number) => void
  ) => {
    try {

      // 1. Set network type (10%)
      onProgress?.(10);
      setNetwork(network);

      // 2. Initialize API (20%)
      onProgress?.(20);
      const api = new OmniBridgeAPI();

      // 3. Create addresses and get fees (30%)
      onProgress?.(30);
      const sender = omniAddress(fromChain, senderAddress);
      const recipient = omniAddress(toChain, recipientAddress);
      const token = omniAddress(fromChain, addressToken);

      const fee = await api.getFee(sender, recipient, token);

      console.log("amount", amount)
      const transfer = {
        tokenAddress: token,
        amount,
        fee: fee.transferred_token_fee || BigInt(0),
        nativeFee: fee.native_token_fee || BigInt(0),
        recipient,
      };

      // 4. Execute transfer transaction (50%)
      onProgress?.(50);
      let result;
      if(fromChain == ChainKind.Sol){
        if (!anchorProvider?.providerProgram) {
          throw new Error('Anchor provider not available. Please ensure your wallet is connected.');
        }
        result = await omniTransfer(anchorProvider.providerProgram as any,transfer)
        console.log('result', result);
      }

      if (!result) {
        throw new Error('Failed to initiate transfer');
      }

      // 5. Waiting for logMetadata (70%)
      onProgress?.(70);
      console.log("Waiting 60 seconds for logMetadata to complete on chain...")
      await new Promise(resolve => setTimeout(resolve, 80000))

      // 6. Get Wormhole VAA and monitor status (85%)
      onProgress?.(85);
      let vaa: string | undefined;
      if (typeof result === 'string') {
        // If result is a transaction hash, get VAA
        vaa = await getVaa(result, "Testnet");
        console.log('Wormhole VAA:', vaa);
      }

      // Monitor status with progress updates
      let transferData: Transfer | undefined;
      const maxRetries = 20;
      const retryDelay = 3000; // 3 seconds

      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        
        // Update progress during monitoring (85% to 95%)
        const monitoringProgress = 85 + Math.floor((i / maxRetries) * 10);
        onProgress?.(monitoringProgress);
        
        try {
          if (typeof result === 'string') {
            // Wait for transaction to be indexed
            const transfers = await api.findOmniTransfers({
              transaction_id: result,
            });
            if (transfers.length > 0 && transfers[0].id) {
              const transferResults = await api.getTransfer({
                originChain: transfers[0].id.origin_chain,
                originNonce: transfers[0].id.origin_nonce,
              });
              if (transferResults.length > 0) {
                transferData = transferResults[0];
                break;
              }
            }
          } else {
            // Handle non-string transfer events
            const originNonce = (result as any).transfer_message?.origin_nonce;
            if (originNonce) {
              const transferResults = await api.getTransfer({
                originChain: 'Sol' as Chain,
                originNonce: originNonce,
              });
              if (transferResults.length > 0) {
                transferData = transferResults[0];
                break;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch transfer (attempt ${i + 1}/${maxRetries}):`, err);
          continue;
        }
      }

      if (!transferData) {
        throw new Error('Failed to fetch transfer data after multiple retries');
      }

      // 7. Get transfer status and complete (100%)
      onProgress?.(100);
      const status = await api.getTransferStatus(
        transferData?.id ? {
          originChain: transferData.id.origin_chain,
          originNonce: transferData.id.origin_nonce,
        } : { transactionHash: result.toString() }
      );

      console.log('transferData', transferData)
      console.log(`Transfer status: ${status}`);
      let txFromChain;
      let txToChain;
      if(fromChain == ChainKind.Sol){
        txFromChain = result.toString()
      }
      if(fromChain == ChainKind.Near){
        txToChain = transferData.finalised?.NearReceipt?.transaction_hash
      }
      if(toChain == ChainKind.Sol){
        txToChain = transferData.finalised?.NearReceipt?.transaction_hash
      }

      return {
        transferData,
        status,
        vaa,
        txFromChain,
        txToChain
      };
    } catch (error) {
      console.error('Bridge error:', error);
      throw error
    } 
  }, [publicKey, sendTransaction, connected]);


  const deployToken = useCallback(async (
    network: NetworkType,
    fromChain: ChainKind,
    toChain: ChainKind,
    tokenAddress: string
  ) => {
    try {
      const secretKey = bs58.decode(SOL_PRIVATE_KEY || "");
      const payer = Keypair.fromSecretKey(secretKey);
      setNetwork(network);
      

      // --- Utility functions ---
      const ensureAnchor = () => {
        if (!anchorProvider?.providerProgram) {
          throw new Error("Anchor provider not available. Please ensure your wallet is connected.");
        }
        return new SolanaBridgeClient(anchorProvider.providerProgram as any);
      };
  
      const ensureNear = async () => {
        if (!nearWalletSelector) {
          throw new Error("NEAR wallet not connected");
        }
        return new NearWalletSelectorBridgeClient(await nearWalletSelector as any);
      };

      const ensureEth = async () => {
        if(!evmAddress && !evmConnected || !walletClient){
          throw new Error('Please connect your EVM wallet first');
        }
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const evmWallet = await provider.getSigner();
  
        return new EvmBridgeClient(evmWallet, ChainKind.Eth)
      }
  
      // --- Deploy from Solana ---
      const deployFromSol = async () => {
        const solClient = ensureAnchor();
        const mintAddress = omniAddress(ChainKind.Sol, tokenAddress);
  
        console.log("Starting logMetadata...");
        const txHash = await solClient.logMetadata(mintAddress, payer);
        console.log("logMetadata txHash:", txHash);
  
        console.log("Waiting for VAA...");
        await new Promise(resolve => setTimeout(resolve, 80000)); // TODO: replace with polling
  
        const vaa = await getVaa(txHash, network === "testnet" ? "Testnet" : "Mainnet");
        console.log("VAA retrieved:", vaa);
  
        let result;
        if (toChain === ChainKind.Near) {
          const nearClient = await ensureNear();
          result = await nearClient.deployToken(ChainKind.Sol, vaa);
        }
  
        return { vaa, result };
      };
  
      // --- Deploy from Near ---
      const deployFromNear = async () => {
        const nearClient = await ensureNear();
        const token = omniAddress(ChainKind.Near, tokenAddress);
  
        const { signature, metadata_payload } = await nearClient.logMetadata(token);
        const sig = new MPCSignature(signature.big_r, signature.s, signature.recovery_id);
        let result;
        if (toChain === ChainKind.Sol) {
          const solClient = ensureAnchor();
          
          console.log("metadata_payload", metadata_payload)
          result = await solClient.deployToken(sig, metadata_payload);
        }
  
        if(toChain == ChainKind.Eth){
          const ethClient = await ensureEth();
          result = await ethClient.deployToken(sig,metadata_payload);
        }

        return { result };
      };
  
      // --- Main flow ---
      if (fromChain === ChainKind.Sol) {
        return await deployFromSol();
      }
      if (fromChain === ChainKind.Near) {
        return await deployFromNear();
      }
      throw new Error("Invalid chain");
  
    } catch (error: any) {
      console.error("Error deploying token:", error.message || error);
      throw error;
    }
  }, [anchorProvider, nearWalletSelector]);  


  return {
    transferToken,
    deployToken
  };
}; 