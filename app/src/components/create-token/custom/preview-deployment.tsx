"use client"

import { useState } from 'react';
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "@/lib/sol";
import { createToken, requestDBCConfig, requestDeployToken, Swap, createTransaction, updateTransactionStatus } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CreateToken, TokenConfig as TokenConfigType, TransactionAction, TransactionStatus, TransactionChain } from "@/types/api";
import { CustomMintData } from '@/types/token';
import { Progress } from '@/components/ui/progress';
import LoadingOverlay from "@/components/ui/loading-overlay";
import TokenCreationModal from "@/components/ui/token-creation-modal";
import TokenSuccessModal from "@/components/ui/token-success-modal";
import { BuyTokenModal } from "@/components/modal/BuyTokenModal";

interface PreviewDeploymentProps {
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  formData?: Partial<CustomMintData>;
}

export default function PreviewDeployment({ 
  onBack,
  onCancel, 
  currentStep = 7, 
  totalSteps = 7,
  formData = {}
}: PreviewDeploymentProps) {
  const walletSol = useWallet();
  const router = useRouter();
  const { publicKey, sendTransaction } = walletSol;
  
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

  // State for buy token modal
  const [isBuyTokenModalOpen, setIsBuyTokenModalOpen] = useState(false);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const extractErrorMessage = (error: unknown): string => {
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
  };

  const getFriendlyDeploymentError = (error: unknown) => {
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
        title: 'Duplicate configuration',
        description: 'A similar deployment was recently submitted. Adjust your configuration and try again.'
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
  };

  // Build custom DBC config from form data
  const buildCustomDBCConfig = () => {
    if (!formData.tokenInfo || !formData.dbcConfig || !formData.baseFeeParams || 
        !formData.lockedVestingParam || !formData.lpDistribution || !formData.authority) {
      throw new Error('Incomplete form data');
    }

    const tokenInfo = formData.tokenInfo;
    const dbcConfig = formData.dbcConfig;
    const feeConfig = formData.baseFeeParams;
    const vestingConfig = formData.lockedVestingParam;
    const liquidityConfig = formData.lpDistribution;
    const authorityConfig = formData.authority;

    return {
      quoteMint: "So11111111111111111111111111111111111111112", // SOL
      dbcConfig: {
        buildCurveMode: parseInt(dbcConfig.buildCurveMode),
        percentageSupplyOnMigration: dbcConfig.percentageSupplyOnMigration,
        migrationQuoteThreshold: dbcConfig.migrationQuoteThreshold,
        totalTokenSupply: tokenInfo.totalTokenSupply,
        migrationOption: parseInt(dbcConfig.migrationOption),
        tokenBaseDecimal: tokenInfo.tokenBaseDecimal,
        tokenQuoteDecimal: tokenInfo.tokenQuoteDecimal,
        lockedVestingParam: {
          totalLockedVestingAmount: vestingConfig.totalLockedVestingAmount,
          numberOfVestingPeriod: vestingConfig.numberOfVestingPeriod,
          cliffUnlockAmount: vestingConfig.cliffUnlockAmount,
          totalVestingDuration: vestingConfig.totalVestingDuration,
          cliffDurationFromMigrationTime: vestingConfig.cliffDurationFromMigrationTime
        },
        baseFeeParams: {
          baseFeeMode: parseInt(feeConfig.baseFeeMode),
          feeSchedulerParam: {
            startingFeeBps: feeConfig.feeSchedulerParam.startingFeeBps,
            endingFeeBps: feeConfig.feeSchedulerParam.endingFeeBps,
            numberOfPeriod: feeConfig.feeSchedulerParam.numberOfPeriod,
            totalDuration: feeConfig.feeSchedulerParam.totalDuration
          }
        },
        dynamicFeeEnabled: dbcConfig.dynamicFeeEnabled,
        activationType: parseInt(dbcConfig.activationType),
        collectFeeMode: parseInt(dbcConfig.collectFeeMode),
        migrationFeeOption: parseInt(dbcConfig.migrationFeeOption),
        tokenType: parseInt(dbcConfig.tokenType),
        partnerLpPercentage: liquidityConfig.partnerLpPercentage,
        creatorLpPercentage: liquidityConfig.creatorLpPercentage,
        partnerLockedLpPercentage: liquidityConfig.partnerLockedLpPercentage,
        creatorLockedLpPercentage: liquidityConfig.creatorLockedLpPercentage,
        creatorTradingFeePercentage: 50, // Default value
        leftover: 0, // Default value
        tokenUpdateAuthority: parseInt(authorityConfig.tokenUpdateAuthority),
        migrationFee: {
          feePercentage: 0,
          creatorFeePercentage: 0
        },
        leftoverReceiver: authorityConfig.leftoverReceiver,
        feeClaimer: authorityConfig.feeClaimer
      },
      dbcPool: {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        metadata: {
          imageUri: tokenInfo.logo || "",
          bannerUri: tokenInfo.banner || "",
          description: tokenInfo.description || "",
          website: tokenInfo.website || "",
          twitter: tokenInfo.twitter || "",
          telegram: tokenInfo.telegram || ""
        }
      }
    };
  };

  const getStepMessage = (step: number): string => {
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
  };

  const getStepSubMessage = (step: number): string => {
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
  };

  const sanitizeUrl = (value: string, placeholders: string[]) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed || placeholders.includes(trimmed)) {
      return undefined;
    }

    if (placeholders.some(placeholder => trimmed.startsWith(placeholder))) {
      return trimmed;
    }

    if (placeholders.includes('https://')) {
      try {
        return new URL(`https://${trimmed}`).toString();
      } catch {
        return undefined;
      }
    }

    return trimmed;
  };

  const handleCreateToken = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.tokenInfo) {
      toast.error('Token information is missing');
      return;
    }

    const tokenInfo = formData.tokenInfo;

    // Validate required fields
    if (!tokenInfo.name.trim()) {
      toast.error('Token name is required');
      return;
    }
    if (!tokenInfo.symbol.trim()) {
      toast.error('Token symbol is required');
      return;
    }
    if (!tokenInfo.description?.trim()) {
      toast.error('Token description is required');
      return;
    }
    if (!tokenInfo.logo) {
      toast.error('Token logo is required');
      return;
    }

    // Show buy token modal
    setIsBuyTokenModalOpen(true);
  };

  const handleBuyTokenConfirm = (amount: string) => {
    executeDeployment(amount);
  };

  const handleBuyTokenSkip = () => {
    executeDeployment("0");
  };

  const executeDeployment = async (purchaseAmount: string) => {
    if (!publicKey || !formData.tokenInfo) {
      return;
    }

    const tokenInfo = formData.tokenInfo;

    setIsDeploying(true);
    setDeploymentStep(1);
    setDeploymentProgress(0);
    setDeploymentStartTime(Date.now());

    try {
      console.log('🚀 Starting custom token deployment...');
      console.log('Wallet public key:', publicKey.toString());
      
      // Step 1: Preparing Configuration
      setDeploymentStep(1);
      setDeploymentProgress(10);
      toast.loading('Preparing token configuration...', {
        id: 'deployment-progress'
      });

      const customConfig = buildCustomDBCConfig();
      console.log('Custom DBC Config:', customConfig);

      const result = await requestDBCConfig({
        metadata: {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol.toUpperCase(),
          description: tokenInfo.description || '',
          imageUri: tokenInfo.logo,
          bannerUri: tokenInfo.banner || undefined,
          website: tokenInfo.website || undefined,
          twitter: tokenInfo.twitter || undefined,
          telegram: tokenInfo.telegram || undefined,
        },
        signer: publicKey.toString()
      });
      
      console.log('DBC Config result:', result);
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
          name: tokenInfo.name,
          symbol: tokenInfo.symbol.toUpperCase(),
          description: tokenInfo.description || '',
          imageUri: tokenInfo.logo,
          bannerUri: tokenInfo.banner || undefined,
          website: tokenInfo.website || undefined,
          twitter: tokenInfo.twitter || undefined,
          telegram: tokenInfo.telegram || undefined,
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

      const sanitizedWebsite = sanitizeUrl(tokenInfo.website || "", ['https://']);
      const sanitizedTwitter = sanitizeUrl(tokenInfo.twitter || "", ['x.com/', 'https://twitter.com/', 'https://x.com/']);
      const sanitizedTelegram = sanitizeUrl(tokenInfo.telegram || "", ['t.me/', 'https://t.me/']);

      const tokenConfig: TokenConfigType = {
        quoteMint: customConfig.quoteMint,
        dbcConfig: customConfig.dbcConfig as any,
      };

      const createTokenPayload: CreateToken = {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol.toUpperCase(),
        description: tokenInfo.description || '',
        totalSupply: tokenInfo.totalTokenSupply.toString(),
        decimals: tokenInfo.tokenBaseDecimal.toString(),
        mintAddress: deployResult.data.baseMint,
        owner: publicKey.toString(),
        tokenUri: tokenInfo.logo || "",
        bannerUri: tokenInfo.banner || "",
        website: sanitizedWebsite || "",
        twitter: sanitizedTwitter || "",
        telegram: sanitizedTelegram || "",
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
            toast.success(`Successfully purchased ${purchaseAmount} SOL worth of ${tokenInfo.symbol}!`);
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
        name: tokenInfo.name,
        symbol: tokenInfo.symbol.toUpperCase(),
        mintAddress: deployResult.data.baseMint,
        logoUrl: tokenInfo.logo || undefined
      });

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('❌ Error during custom token deployment:', error);
      
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
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCreatedTokenData(null);
    onCancel(); // Close the entire create token flow
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
        tokenLogo={formData.tokenInfo?.logo || undefined}
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

      <BuyTokenModal
        open={isBuyTokenModalOpen}
        onOpenChange={setIsBuyTokenModalOpen}
        tokenSymbol={formData.tokenInfo?.symbol || "TOKEN"}
        tokenLogo={formData.tokenInfo?.logo || undefined}
        onConfirm={handleBuyTokenConfirm}
        onSkip={handleBuyTokenSkip}
      />

    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Preview Deployment
        </h1>
        <p className="text-gray-600 text-lg">
          Review your configuration and deploy your token.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 mb-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-black font-medium">Step {currentStep} of {totalSteps}</span>
          <span className="text-black font-medium">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2"
          bgProgress="bg-red-500"
        />
      </div>

      {/* Preview Content */}
      <div className="w-full px-4 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Token Info Preview */}
          {formData.tokenInfo && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Token Information</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{formData.tokenInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Symbol:</span>
                    <p className="font-medium">{formData.tokenInfo.symbol}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="font-medium">{formData.tokenInfo.description || 'No description'}</p>
                  </div>
                  
                </div>
              </div>
            </div>
          )}

          {/* Tokenomics Preview */}
          {formData.tokenInfo && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Tokenomics</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Supply:</span>
                    <p className="font-medium">{formData.tokenInfo.totalTokenSupply?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Base Decimal:</span>
                    <p className="font-medium">{formData.tokenInfo.tokenBaseDecimal}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Quote Decimal:</span>
                    <p className="font-medium">{formData.tokenInfo.tokenQuoteDecimal}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vesting Preview */}
          {formData.lockedVestingParam && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Vesting Configuration</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Vesting Amount:</span>
                    <p className="font-medium">{formData.lockedVestingParam.totalLockedVestingAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Vesting Periods:</span>
                    <p className="font-medium">{formData.lockedVestingParam.numberOfVestingPeriod}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cliff Amount:</span>
                    <p className="font-medium">{formData.lockedVestingParam.cliffUnlockAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cliff Duration:</span>
                    <p className="font-medium">{formData.lockedVestingParam.cliffDurationFromMigrationTime} days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liquidity Preview */}
          {formData.lpDistribution && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Liquidity Distribution</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Partner LP:</span>
                    <p className="font-medium">{formData.lpDistribution.partnerLpPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Creator LP:</span>
                    <p className="font-medium">{formData.lpDistribution.creatorLpPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Partner Locked:</span>
                    <p className="font-medium">{formData.lpDistribution.partnerLockedLpPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Creator Locked:</span>
                    <p className="font-medium">{formData.lpDistribution.creatorLockedLpPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Authority Preview */}
          {formData.authority && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Authority Settings</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Update Authority:</span>
                    <p className="font-medium">{formData.authority.tokenUpdateAuthority}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Leftover Receiver:</span>
                    <p className="font-medium text-xs break-all">{formData.authority.leftoverReceiver}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Fee Claimer:</span>
                    <p className="font-medium text-xs break-all">{formData.authority.feeClaimer}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deployment Summary */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-black mb-4">Deployment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Solana Mainnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">RPC Endpoint:</span>
                <span className="font-medium">Default Solana RPC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-medium">~0.001 SOL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 max-w-4xl mx-auto px-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg transition-colors hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button 
            type="button"
            onClick={handleCreateToken}
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
                Create Token
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
