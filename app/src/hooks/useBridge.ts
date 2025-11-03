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
  EvmBridgeClient,
  normalizeAmount
} from 'omni-bridge-sdk';
import { SOL_PRIVATE_KEY } from '../configs/env.config';
import useAnchorProvider from '@/hooks/useAnchorProvider';
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


  const ensureSolana = async () => {
    if (!anchorProvider?.providerProgram) {
      throw new Error("Anchor provider not available. Please ensure your wallet is connected.");
    }
    return new SolanaBridgeClient(anchorProvider.providerProgram as any);
  };

  const ensureNear = async () => {
    if (!nearWalletSelector) {
      throw new Error("NEAR wallet not connected");
    }
    return new NearWalletSelectorBridgeClient(await nearWalletSelector);
  };

  const ensureEth = async () => {
    if(!evmAddress && !evmConnected || !walletClient){
      throw new Error('Please connect your EVM wallet first');
    }
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const evmWallet = await provider.getSigner();
    return new EvmBridgeClient(evmWallet, ChainKind.Eth);
  };

  // Bridge from Solana to NEAR
  const transferToken = async (
    network: NetworkType,
    fromChain: ChainKind,
    toChain: ChainKind,
    senderAddress: string,
    addressToken: string,
    amount: bigint,
    recipientAddress: string,
    onProgress?: (progress: number) => void,
  ) => {
    try {
      // 1. Set network type (10%)
      setNetwork(network);
      onProgress?.(10);

      // 2. Initialize API (20%)
      const api = new OmniBridgeAPI();
      onProgress?.(20);

      // 3. Create addresses and get fees (30%)
      const sender = omniAddress(fromChain, senderAddress);
      const recipient = omniAddress(toChain, recipientAddress);
      const token = omniAddress(fromChain, addressToken);
      onProgress?.(40);

      const fee = await api.getFee(sender, recipient, token, amount);
      onProgress?.(50);

      console.log("amount", amount)
      const transfer = {
        tokenAddress: token,
        amount,
        fee: fee.transferred_token_fee || BigInt(0),
        nativeFee: fee.native_token_fee || BigInt(0),
        recipient,
      };

      const solClient = await ensureSolana();
      onProgress?.(70);

      const tx = await solClient.initTransfer(transfer);
      onProgress?.(100);

      return tx;
    } catch (error) {
      console.error('Bridge error:', error);
      throw error
    } 
  }

  const deployToken = async (
    network: NetworkType,
    fromChain: ChainKind,
    toChain: ChainKind,
    tokenAddress: string
  ) => {
    try {
      const secretKey = bs58.decode(SOL_PRIVATE_KEY || "");
      const payer = Keypair.fromSecretKey(secretKey);
      setNetwork(network);

      // --- Deploy from Solana ---
      const deployFromSol = async () => {
        const solClient = await ensureSolana();
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
          const solClient = await ensureSolana();
          
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
  }  


  return {
    transferToken,
    deployToken
  };
}; 