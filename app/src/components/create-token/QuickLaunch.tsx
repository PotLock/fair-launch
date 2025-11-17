"use client"

import { useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "@/lib/sol";
import { uploadImage, createToken, requestDBCConfig, requestDeployToken, Swap, createTransaction, updateTransactionStatus } from "@/lib/api";
import { getDBCConfig } from "@/configs/dbc.config";
import { useRouter } from "next/navigation";
import { CreateToken, DBCConfig, TokenConfig as TokenConfigType, TransactionAction, TransactionStatus, TransactionChain } from "@/types/api";
import LoadingOverlay from "@/components/ui/loading-overlay";
import TokenCreationModal from "@/components/ui/token-creation-modal";
import TokenSuccessModal from "@/components/ui/token-success-modal";
import URLInput from "@/components/ui/url-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TagsSelectModal, TAG_ICONS } from "@/components/modal/TagsSelectModal";
import { BuyTokenModal } from "@/components/modal/BuyTokenModal";

interface QuickLaunchProps {
  onCancel?: () => void;
}

export default function QuickLaunch({ onCancel }: QuickLaunchProps) {
  const walletSol = useWallet()
  const router = useRouter()
  const { publicKey, sendTransaction} = walletSol
  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    tokenSupply: "1000000000",
    decimal: "6",
    description: "",
    twitterUrl: "",
    websiteUrl: "",
    telegramUrl: ""
  });

  // State for image uploads
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  // State for tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // State for buy token modal
  const [isBuyTokenModalOpen, setIsBuyTokenModalOpen] = useState(false);

  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [deploymentStep, setDeploymentStep] = useState<number>(1);
  const [deploymentProgress, setDeploymentProgress] = useState<number>(0);
  const [deploymentStartTime, setDeploymentStartTime] = useState<number | undefined>(undefined);
  const [createdTokenData, setCreatedTokenData] = useState<{
    name: string;
    symbol: string;
    mintAddress: string;
    logoUrl?: string;
  } | null>(null);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((field: string, value: string) => {
    let next = value;

    if (field === 'tokenSymbol') {
      next = value.slice(0, 5);
    }

    if (field === 'tokenSupply') {
      next = value.replace(/[^\d]/g, '');
    }

    if (field === 'decimal') {
      next = value.replace(/[^\d]/g, '').slice(0, 2);
    }
    // Normalize social inputs
    if (field === 'twitterUrl') {
      // Allow free editing - just store what user types
      next = value;
    }

    if (field === 'telegramUrl') {
      // Allow free editing - just store what user types
      next = value;
    }

    if (field === 'websiteUrl') {
      // Allow free editing - just store what user types
      next = value;
    }

    setFormData(prev => ({ ...prev, [field]: next }));
  }, []);

  const handleImageUpload = useCallback(async (type: 'logo' | 'banner', file: File) => {
    if (!file) {
      console.error('No file provided for upload');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      if (type === 'logo') {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingBanner(true);
      }

      // Upload the image using our API
      const fileName = `${type}-${Date.now()}-${file.name}`;
      const result = await uploadImage(file, fileName);

      if (result.success && result.data?.imageUri) {
        const imageUrl = result.data.imageUri;
        if (type === 'logo') {
          setLogoUrl(imageUrl);
          toast.success('Logo uploaded successfully!');
        } else {
          setBannerUrl(imageUrl);
          toast.success('Banner uploaded successfully!');
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}. Please try again.`);
    } finally {
      if (type === 'logo') {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  }, []);

  const handleFileUpload = useCallback((type: 'logo' | 'banner') => {
    const inputRef = type === 'logo' ? logoInputRef : bannerInputRef;
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((type: 'logo' | 'banner', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files;
    if (file) {
      handleImageUpload(type, file[0]);
    }
  }, [handleImageUpload]);

  const handleImageDrop = useCallback((type: 'logo' | 'banner', e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(type, file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const getStepMessage = useCallback((step: number): string => {
    const messages = [
      "Preparing Configuration",
      "Sending Configuration",
      "Confirming Configuration",
      "Deploying Token",
      "Sending Deployment Transaction",
      "Confirming Deployment",
      "Saving Details"
    ];
    return messages[step - 1] || "Processing...";
  }, []);

  const getStepSubMessage = useCallback((step: number): string => {
    const subMessages = [
      "Setting up token parameters",
      "Submitting configuration transaction",
      "Waiting for confirmation",
      "Creating your token on blockchain",
      "Sending token deployment transaction",
      "Finalizing token creation",
      "Storing token information"
    ];
    return subMessages[step - 1] || "Please wait...";
  }, []);

  const sanitizeUrl = useCallback((value: string, type: 'twitter' | 'telegram' | 'website') => {
    if (!value) return undefined;
    const trimmed = value.trim();

    if (type === 'twitter') {
      // Extract username from various formats
      const raw = trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^(x\.com|twitter\.com)\//, '');
      const username = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 15);
      return username ? `https://x.com/${username}` : undefined;
    }

    if (type === 'telegram') {
      // Extract handle from various formats
      const raw = trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^(t\.me|telegram\.me|telegram\.org)\//, '');
      const handle = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
      return handle.length >= 5 ? `https://t.me/${handle}` : undefined;
    }

    if (type === 'website') {
      // Ensure valid URL format
      if (!trimmed) return undefined;
      const withoutProto = trimmed.replace(/^https?:\/\//, '');
      if (!withoutProto) return undefined;
      try {
        const url = new URL(`https://${withoutProto}`);
        return url.toString();
      } catch {
        return undefined;
      }
    }

    return trimmed;
  }, []);

  const extractErrorMessage = useCallback((error: unknown): string => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || 'Unknown error';
    if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }, []);

  const getFriendlyDeploymentError = useCallback((error: unknown) => {
    const rawMessage = extractErrorMessage(error);
    const normalized = rawMessage.toLowerCase();

    if (!rawMessage || normalized === 'unknown error') {
      return {
        title: 'Deployment failed',
        description: 'Something went wrong during deployment. Please try again.'
      };
    }

    if (normalized.includes('user rejected') || normalized.includes('user denied') || normalized.includes('transaction cancelled')) {
      return {
        title: 'Transaction rejected',
        description: 'You rejected the transaction in your wallet. Please approve it to continue.'
      };
    }

    if (normalized.includes('insufficient funds') || normalized.includes('insufficient sol') || normalized.includes('lamports')) {
      return {
        title: 'Insufficient SOL balance',
        description: 'Your wallet does not have enough SOL to cover fees. Please top up and try again.'
      };
    }

    if (normalized.includes('simulation failed') || normalized.includes('instruction error')) {
      return {
        title: 'Simulation failed',
        description: 'The transaction simulation failed. Double-check your token details or try again in a few moments.'
      };
    }

    if (normalized.includes('blockhash not found') || normalized.includes('expired') || normalized.includes('block height exceeded')) {
      return {
        title: 'Transaction expired',
        description: 'The transaction took too long and expired. Please try submitting again.'
      };
    }

    if (normalized.includes('already in use')) {
      return {
        title: 'Duplicate token symbol',
        description: 'A token with similar configuration was recently deployed. Please modify the token details and retry.'
      };
    }

    if (normalized.includes('network request failed') || normalized.includes('failed to fetch') || normalized.includes('rpc')) {
      return {
        title: 'Network error',
        description: 'Unable to reach the Solana RPC. Check your internet connection and try again.'
      };
    }

    if (normalized.includes('custom program error')) {
      return {
        title: 'Program error',
        description: 'The deployment program returned an error. Please wait a moment or adjust your configuration.'
      };
    }

    return {
      title: 'Deployment failed',
      description: rawMessage
    };
  }, [extractErrorMessage]);

  const handleDeployToken = async () => {
    if(!publicKey){
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate required fields
    if (!formData.tokenName.trim()) {
      toast.error('Token name is required');
      return;
    }
    if (!formData.tokenSymbol.trim()) {
      toast.error('Token symbol is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Token description is required');
      return;
    }
    if (!logoUrl) {
      toast.error('Token logo is required');
      return;
    }
    if (!bannerUrl) {
      toast.error('Token banner is required');
      return;
    }

    const totalSupply = Number(formData.tokenSupply);
    if (!Number.isFinite(totalSupply) || totalSupply <= 0 || !Number.isInteger(totalSupply)) {
      toast.error('Token supply must be a positive integer');
      return;
    }

    const decimals = Number(formData.decimal);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 99) {
      toast.error('Token decimals must be an integer between 0 and 99');
      return;
    }

    // Show buy token modal
    setIsBuyTokenModalOpen(true);
  }

  const handleBuyTokenConfirm = (amount: string) => {
    executeDeployment(amount);
  };

  const handleBuyTokenSkip = () => {
    executeDeployment("0");
  };

  const executeDeployment = async (purchaseAmount: string) => {
    
    if(!publicKey){
      toast.error("Please connect wallet solana")
      return
    }

    setIsDeploying(true);
    setDeploymentStep(1);
    setDeploymentProgress(0);
    setDeploymentStartTime(Date.now());

    try {
      console.log('🚀 Starting token deployment...');
      console.log('Wallet public key:', publicKey.toString());
      
      // Step 1: Preparing Configuration
      setDeploymentStep(1);
      setDeploymentProgress(10);
      toast.loading('Preparing token configuration...', {
        id: 'deployment-progress'
      });

      const result = await requestDBCConfig({
        metadata: {
          name: formData.tokenName,
          symbol: formData.tokenSymbol.toUpperCase(),
          description: formData.description,
          imageUri: logoUrl || undefined,
          bannerUri: bannerUrl || undefined,
          website: formData.websiteUrl || undefined,
          twitter: formData.twitterUrl || undefined,
          telegram: formData.telegramUrl || undefined,
        },
        signer: publicKey.toString()
      });
      console.log(result)
      const serialized = result.data.transaction; 
      const txBuffer = Buffer.from(serialized, "base64");

      let transaction;

      try {
        transaction = VersionedTransaction.deserialize(txBuffer);
        console.log("Transaction is VersionedTransaction");
      } catch {
        transaction = Transaction.from(txBuffer);
        console.log("Transaction is Legacy Transaction");
      }

      const connection = new Connection(getRpcSOLEndpoint());
      
      try {
        let simulation;
        if (transaction instanceof VersionedTransaction) {
          simulation = await connection.simulateTransaction(transaction);
        } else {
          simulation = await connection.simulateTransaction(transaction);
        }
        
        if (simulation.value.err) {
          console.error('❌ Simulation error:', simulation.value.err);
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        console.log('✅ Simulation successful!');
      } catch (simError) {
        console.error('❌ Simulation failed:', simError);
        throw simError;
      }
      
      // Step 2: Sending Configuration Transaction
      setDeploymentStep(2);
      setDeploymentProgress(25);
      toast.loading('Sending configuration transaction...', {
        id: 'deployment-progress'
      });
      
      const signatureDBCConfig = await sendTransaction(
        transaction,
        connection,
        {
          skipPreflight: false,
          preflightCommitment: 'processed'
        }
      );
    
      // Step 3: Confirming Configuration Transaction
      setDeploymentStep(3);
      setDeploymentProgress(40);
      toast.loading('Confirming configuration transaction...', {
        id: 'deployment-progress'
      });
      
      await connection.confirmTransaction(signatureDBCConfig, 'confirmed');

      // Step 4: Deploying Token
      setDeploymentStep(4);
      setDeploymentProgress(55);
      toast.loading('Deploying token...', {
        id: 'deployment-progress'
      });
      
      const deployResult = await requestDeployToken({
        metadata: {
          name: formData.tokenName,
          symbol: formData.tokenSymbol.toUpperCase(),
          description: formData.description,
          imageUri: logoUrl || undefined,
          bannerUri: bannerUrl || undefined,
          website: formData.websiteUrl || undefined,
          twitter: formData.twitterUrl || undefined,
          telegram: formData.telegramUrl || undefined,
        },
        signer: publicKey.toString(),
        dbcConfigKeypair: result.data.dbcConfigKeypair._keypair
      });
      console.log('Deploy token result:', deployResult);
      
      const serializedDeployTx = deployResult.data.transaction;
      const deployTxBuffer = Buffer.from(serializedDeployTx, "base64");

      let deployTransaction;

      try {
        deployTransaction = VersionedTransaction.deserialize(deployTxBuffer);
        console.log("Deploy Transaction is VersionedTransaction");
      } catch {
        deployTransaction = Transaction.from(deployTxBuffer);
        console.log("Deploy Transaction is Legacy Transaction");
      }

      // Step 5: Sending Token Deployment Transaction
      setDeploymentStep(5);
      setDeploymentProgress(70);
      toast.loading('Sending token deployment transaction...', {
        id: 'deployment-progress'
      });
      
      const signatureDeployToken = await sendTransaction(
        deployTransaction,
        connection,
        {
          skipPreflight: false,
          preflightCommitment: 'processed'
        }
      );
    
      // Step 6: Confirming Token Deployment
      setDeploymentStep(6);
      setDeploymentProgress(85);
      toast.loading('Confirming token deployment...', {
        id: 'deployment-progress'
      });
      
      await connection.confirmTransaction(signatureDeployToken, 'confirmed');

      // Step 7: Saving Token Details
      setDeploymentStep(7);
      setDeploymentProgress(95);
      toast.loading('Saving token details...', {
        id: 'deployment-progress'
      });

      const sanitizedWebsite = sanitizeUrl(formData.websiteUrl, 'website');
      const sanitizedTwitter = sanitizeUrl(formData.twitterUrl, 'twitter');
      const sanitizedTelegram = sanitizeUrl(formData.telegramUrl, 'telegram');

      const metadata = {
        name: formData.tokenName,
        symbol: formData.tokenSymbol.toUpperCase(),
        description: formData.description,
        imageUri: logoUrl || undefined,
        bannerUri: bannerUrl || undefined,
        website: sanitizedWebsite,
        twitter: sanitizedTwitter,
        telegram: sanitizedTelegram,
      };

      const totalSupply = Number(formData.tokenSupply);
      const decimals = Number(formData.decimal);

      const dbcConfigData = getDBCConfig(publicKey, formData.tokenName, formData.tokenSymbol, metadata);

      const tokenConfig: TokenConfigType = {
        quoteMint: (dbcConfigData.quoteMint as string) || "",
        dbcConfig: ({
          ...dbcConfigData.dbcConfig!,
          totalTokenSupply: totalSupply,
          tokenBaseDecimal: decimals,
        } as unknown) as DBCConfig,
      };

      const createTokenPayload: CreateToken = {
        name: formData.tokenName,
        symbol: formData.tokenSymbol.toUpperCase(),
        description: formData.description,
        totalSupply: formData.tokenSupply,
        decimals: formData.decimal,
        mintAddress: deployResult.data.baseMint,
        owner: publicKey.toString(),
        tokenUri: logoUrl || "",
        bannerUri: bannerUrl || "",
        website: sanitizedWebsite || "",
        twitter: sanitizedTwitter || "",
        telegram: sanitizedTelegram || "",
        tags: selectedTags,
        tokenConfig,
      };

      await createToken(createTokenPayload);

      console.log('✅ Deploy transaction confirmed:', signatureDeployToken);

      // Handle token purchase if amount > 0
      if (parseFloat(purchaseAmount) > 0) {
        let createdTransactionId: string | null = null;
        
        try {

          setDeploymentStep(7);
          setDeploymentProgress(92);
          toast.loading('Waiting for token to load on-chain...', {
            id: 'deployment-progress'
          });

          const waitTime = 10000; // 10 seconds
          const startTime = Date.now();
          const interval = 1000; // Update every second

          while (Date.now() - startTime < waitTime) {
            const elapsed = Date.now() - startTime;
            const progress = 92 + Math.floor((elapsed / waitTime) * 3); // Progress from 92% to 95%
            setDeploymentProgress(Math.min(progress, 95));
            await new Promise(resolve => setTimeout(resolve, interval));
          }

          setDeploymentProgress(95);
          toast.loading('Purchasing tokens...', {
            id: 'deployment-progress'
          });

          const swapParams = {
            baseMint: deployResult.data.baseMint,
            signer: publicKey.toString(),
            amount: parseFloat(purchaseAmount),
            slippageBps: 50, // 0.5% slippage
            swapBaseForQuote: false, // Buying tokens with SOL
            computeUnitPriceMicroLamports: 100000,
          };

          const swapResult = await Swap(swapParams);

          if (swapResult.success) {
            const serializedSwapTx = swapResult.data.transaction;
            const swapTxBuffer = Buffer.from(serializedSwapTx, "base64");
            const swapTransaction = Transaction.from(swapTxBuffer);

            const signatureSwap = await sendTransaction(
              swapTransaction,
              connection,
              {
                skipPreflight: false,
                preflightCommitment: 'processed'
              }
            );

            // Create transaction record
            try {
              const amountIn = parseFloat(purchaseAmount);
              const baseToken = "So11111111111111111111111111111111111111112"; // SOL
              const quoteToken = deployResult.data.baseMint;

              const created = await createTransaction({
                userAddress: publicKey.toString(),
                txHash: signatureSwap,
                action: TransactionAction.BUY,
                baseToken,
                quoteToken,
                amountIn,
                amountOut: 0, // Will be updated after transaction confirmation if needed
                pricePerToken: 0, // Will be calculated if needed
                slippageBps: 50,
                fee: 0,
                feeToken: "SOL",
                status: TransactionStatus.PENDING,
                chain: TransactionChain.SOLANA,
                poolAddress: deployResult.data.baseMint,
              });
              createdTransactionId = created.id;
            } catch (e) {
              console.error("Error creating transaction record:", e);
            }

            await connection.confirmTransaction(signatureSwap, 'confirmed');

            // Update transaction status to success
            if (createdTransactionId) {
              try {
                await updateTransactionStatus(createdTransactionId, TransactionStatus.SUCCESS, signatureSwap);
              } catch (e) {
                console.error("Error updating transaction status to success:", e);
              }
            }

            console.log('✅ Token purchase confirmed:', signatureSwap);
            toast.success(`Successfully purchased ${purchaseAmount} SOL worth of ${formData.tokenSymbol}!`);
          }
        } catch (purchaseError) {
          console.error('❌ Error purchasing tokens:', purchaseError);
          
          // If we already created a transaction record, mark it failed
          if (createdTransactionId) {
            try {
              await updateTransactionStatus(createdTransactionId, TransactionStatus.FAILED);
            } catch (e) {
              console.error("Error updating transaction status to failed:", e);
            }
          }
          
          toast.warning('Token deployed successfully, but purchase failed', {
            description: 'You can still buy tokens manually from the token page.'
          });
        }
      }

      // Complete deployment
      setDeploymentProgress(100);
      toast.dismiss('deployment-progress');

      // Store token data for success modal
      setCreatedTokenData({
        name: formData.tokenName,
        symbol: formData.tokenSymbol.toUpperCase(),
        mintAddress: deployResult.data.baseMint,
        logoUrl: logoUrl || undefined
      });

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('❌ Error during token deployment:', error);
      
      toast.dismiss('deployment-progress');
      const friendlyError = getFriendlyDeploymentError(error);
      toast.error(friendlyError.title, {
        description: friendlyError.description
      });
    } finally {
      setIsDeploying(false);
      setIsNavigating(false);
      setDeploymentStep(1);
      setDeploymentProgress(0);
      setDeploymentStartTime(undefined);
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCreatedTokenData(null);
    onCancel?.();
  };

  const handleViewToken = () => {
    if (createdTokenData?.mintAddress) {
      setShowSuccessModal(false);
      setIsNavigating(true);
      router.push(`/token/${createdTokenData.mintAddress}`);
    }
  };

  return (
    <>
      <TokenCreationModal
        isVisible={isDeploying}
        stepMessage={getStepMessage(deploymentStep)}
        subMessage={getStepSubMessage(deploymentStep)}
        progress={deploymentProgress}
        tokenLogo={logoUrl || undefined}
        startTime={deploymentStartTime}
      />
      <TokenSuccessModal
        isVisible={showSuccessModal}
        tokenName={createdTokenData?.name || ''}
        tokenSymbol={createdTokenData?.symbol || ''}
        tokenLogo={createdTokenData?.logoUrl}
        mintAddress={createdTokenData?.mintAddress}
        onClose={handleSuccessModalClose}
        onViewToken={handleViewToken}
      />
      <LoadingOverlay 
        isVisible={isNavigating}
        message="Redirecting to your token..."
        subMessage="Please wait while we take you to your token page"
      />
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black px-4">
              Make your own token
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-5 h-5">
                  <Info className="w-5 h-5 text-gray-400 cursor-help" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-1">Dynamic Bonding Curve (DBC)</p>
                <p>Your token launches with a virtual liquidity pool using Meteora's DBC. It automatically migrates to a full DEX pool once the fundraising target is reached (minimum 750 USD).</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Add your token name, symbol, logo, and social links.
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Name <strong className="text-red-500">*</strong>
              </label>
              <input
                type="text"
                placeholder="e.g, Dogecoin"
                value={formData.tokenName}
                onChange={(e) => handleInputChange('tokenName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Symbol <strong className="text-red-500">*</strong>
              </label>
              <input
                type="text"
                placeholder="Token Symbol"
                value={formData.tokenSymbol.toUpperCase()}
                onChange={(e) => handleInputChange('tokenSymbol', e.target.value)}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Token Supply <strong className="text-red-500">*</strong>
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Total number of tokens that will exist. Part of this supply goes into the bonding curve reserve, while the rest enters circulation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.tokenSupply}
                onChange={(e) => handleInputChange('tokenSupply', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Decimal <strong className="text-red-500">*</strong>
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Number of decimal places for your token. Higher decimals (6-9) allow for more precise pricing and trading.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{1,2}"
                maxLength={2}
                value={formData.decimal}
                onChange={(e) => handleInputChange('decimal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your token's purpose
            </label>
            <textarea
              placeholder="Describe your token's purpose"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base resize-none"
            />
          </div>

          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border border-gray-300 rounded-lg bg-neutral-50">
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg border border-gray-200 transition-shadow"
                    >
                      <span className="text-base">{TAG_ICONS[tag] || "📦"}</span>
                      <span className="capitalize">{tag}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  No tags selected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsTagsModalOpen(true)}
              className="mt-2 px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              {selectedTags.length > 0 ? "Edit Tags" : "Add Tags"}
            </button>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Token Branding <strong className="text-red-500">*</strong></h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Logo Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => handleFileUpload('logo')}
              onDrop={(e) => handleImageDrop('logo', e)}
              onDragOver={handleDragOver}
            >
              {logoUrl ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_IPFS_URL}${logoUrl}`} 
                    alt="Token Logo" 
                    className="w-32 h-32 object-cover rounded-lg mb-2"
                  />
                  {isUploadingLogo && (
                    <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    {isUploadingLogo ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    ) : (
                      <img src="/icons/add-image.svg" alt="Add Image" />
                    )}
                  </div>
                  <h4 className="text-gray-700 mb-1 font-medium text-sm">
                    Token Logo <strong className="text-red-500">*</strong>
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 512x512px</p>
                </div>
              )}
            </div>

            {/* Banner Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => handleFileUpload('banner')}
              onDrop={(e) => handleImageDrop('banner', e)}
              onDragOver={handleDragOver}
            >
              {bannerUrl ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_IPFS_URL}${bannerUrl}`} 
                    alt="Banner Image" 
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  {isUploadingBanner && (
                    <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    {isUploadingBanner ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    ) : (
                      <img src="/icons/add-image.svg" alt="Add Image" />
                    )}
                  </div>
                  <h4 className="font-medium text-gray-700 mb-1 text-sm">
                    Banner image <strong className="text-red-500">*</strong>
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1500x500px</p>
                </div>
              )}
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('logo', e)}
            className="hidden"
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('banner', e)}
            className="hidden"
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-black">Add Socials</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X/Twitter
              </label>
              <URLInput
                prefix="x.com/"
                value={formData.twitterUrl}
                onChange={(value) => handleInputChange('twitterUrl', value)}
                placeholder="yourusername"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <URLInput
                prefix="https://"
                value={formData.websiteUrl}
                onChange={(value) => handleInputChange('websiteUrl', value)}
                placeholder="yourwebsite.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <URLInput
                prefix="t.me/"
                value={formData.telegramUrl}
                onChange={(value) => handleInputChange('telegramUrl', value)}
                placeholder="yourchannel"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <button 
            onClick={onCancel}
            disabled={isDeploying || isNavigating}
            className={`w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
              isDeploying || isNavigating
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={handleDeployToken} 
            disabled={isDeploying || isNavigating}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors flex items-center justify-center ${
              isDeploying || isNavigating
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
            }`}
          >
            {isDeploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {'Deploying...'}
              </>
            ) : isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {'Redirecting...'}
              </>
            ) : (
              <>
                Deploy Token
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      <TagsSelectModal
        open={isTagsModalOpen}
        onOpenChange={setIsTagsModalOpen}
        value={selectedTags}
        onConfirm={(tags) => setSelectedTags(tags)}
      />

      <BuyTokenModal
        open={isBuyTokenModalOpen}
        onOpenChange={setIsBuyTokenModalOpen}
        tokenSymbol={formData.tokenSymbol || "TOKEN"}
        tokenLogo={logoUrl || undefined}
        onConfirm={handleBuyTokenConfirm}
        onSkip={handleBuyTokenSkip}
      />
    </>
  );
}
