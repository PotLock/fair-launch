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
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { NearWalletSelectorBridgeClient } from 'omni-bridge-sdk/dist/src/clients/near-wallet-selector';

export const useBridge = () => {
  const anchorProvider = useAnchorProvider()
  const { walletSelector: nearWalletSelector } = useWalletSelector()
  const { address: evmAddress, isConnected: evmConnected } = useAccount(); 
  const { data: walletClient } = useWalletClient();


  const ensureSolana = async () => {
    if (!anchorProvider?.providerProgram) {
      throw new Error("Anchor provider not available. Please ensure your wallet is connected.");
    }
    return new SolanaBridgeClient(anchorProvider.providerProgram);
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
      console.log("tokenAddress", tokenAddress)
      console.log("fromChain", fromChain)
      console.log("toChain", toChain)
      const secretKey = bs58.decode(SOL_PRIVATE_KEY || "");
      const payer = Keypair.fromSecretKey(secretKey);
      setNetwork(network);

      // --- Deploy from Solana ---
      const deployFromSol = async () => {
        const solClient = await ensureSolana();
        const mintAddress = omniAddress(ChainKind.Sol, tokenAddress);

        console.log("Starting logMetadata...");
        try {
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

          return { result };
        } catch (error: any) {
          // Check if error is due to transaction already being processed
          const errorMessage = error?.message || error?.toString() || '';
          if (errorMessage.includes('already been processed')) {
            console.log("Token metadata already logged on Solana - treating as success");
            // Token already deployed, this is not an error
            throw new Error('Token already deployed');
          }
          throw error;
        }
      };

      // --- Deploy from Near ---
      const deployFromNear = async () => {
        const nearClient = await ensureNear();

        // Validate token address format for NEAR
        if (!tokenAddress || tokenAddress.trim() === '') {
          throw new Error('Invalid NEAR token address: address cannot be empty');
        }

        // NEAR account names must end with .testnet or .near (or be implicit account)
        const isValidNearAccount = tokenAddress.endsWith('.testnet') ||
                                   tokenAddress.endsWith('.near') ||
                                   tokenAddress.length === 64; // implicit account

        if (!isValidNearAccount) {
          throw new Error(`Invalid NEAR token address format: ${tokenAddress}. Must end with .testnet, .near, or be a 64-character implicit account.`);
        }

        const token = omniAddress(ChainKind.Near, tokenAddress);

        console.log("=== Pre-logMetadata Debug Info ===");
        console.log("Raw token address:", tokenAddress);
        console.log("OmniAddress token:", token);

        let signature, metadata_payload;
        try {
          const result = await nearClient.logMetadata(token);
          signature = result.signature;
          metadata_payload = result.metadata_payload;
        } catch (error: any) {
          console.error("Error message:", error?.message);
          console.error("Error stack:", error?.stack);
          console.error("Full error:", JSON.stringify(error, null, 2));

          throw error;
        }

        const sig = new MPCSignature(signature.big_r, signature.s, signature.recovery_id);

        console.log("=== Post-logMetadata Debug Info ===");
        console.log("Signature:", {
          big_r: signature.big_r,
          s: signature.s,
          recovery_id: signature.recovery_id
        });
        console.log("Metadata payload:", JSON.stringify(metadata_payload, null, 2));
        console.log("Metadata payload.token:", metadata_payload.token);
        console.log("Metadata payload.name:", metadata_payload.name);
        console.log("Metadata payload.symbol:", metadata_payload.symbol);
        console.log("Metadata payload.decimals:", metadata_payload.decimals);

        let result;
        if (toChain === ChainKind.Sol) {
          const solClient = await ensureSolana();

          console.log("=== Attempting Solana Deployment ===");
          console.log("Network:", network);
          console.log("From chain:", fromChain);
          console.log("To chain:", toChain);
          console.log("Token address input:", tokenAddress);
          console.log("OmniAddress token:", token);
          console.log("Metadata payload:", JSON.stringify(metadata_payload, null, 2));
          console.log("Signature:", sig);

          result = await solClient.deployToken(sig, metadata_payload);
        }

        if(toChain == ChainKind.Eth){
          const ethClient = await ensureEth();
          result = await ethClient.deployToken(sig,metadata_payload);
        }

        return { result: result?.txHash };
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
      const errorMessage = error?.message || error?.toString() || '';
      console.error("Error deploying token:", errorMessage);

      // Re-throw with better error message
      if (errorMessage.includes('already deployed') || errorMessage.includes('already been processed')) {
        throw new Error('Token already deployed');
      }
      throw error;
    }
  }  


  return {
    transferToken,
    deployToken
  };
}; 