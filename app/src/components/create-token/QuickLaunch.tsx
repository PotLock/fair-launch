"use client"

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "@/lib/sol";
import { uploadImage, createToken, requestDBCConfig, requestDeployToken } from "@/lib/api";
import { getDBCConfig } from "@/configs/dbc.config";
import { useRouter } from "next/navigation";
import { CreateToken, DBCConfig, TokenConfig as TokenConfigType } from "@/types/api";
import LoadingOverlay from "@/components/ui/loading-overlay";
import TokenCreationModal from "@/components/ui/token-creation-modal";
import URLInput from "@/components/ui/url-input";

interface QuickLaunchProps {
  onCancel: () => void;
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
    twitterUrl: "x.com/",
    websiteUrl: "https://",
    telegramUrl: "t.me/"
  });

  // State for image uploads
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [deploymentStep, setDeploymentStep] = useState<number>(1);
  const [deploymentProgress, setDeploymentProgress] = useState<number>(0);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (type: 'logo' | 'banner', file: File) => {
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
  };

  const handleFileUpload = (type: 'logo' | 'banner') => {
    const inputRef = type === 'logo' ? logoInputRef : bannerInputRef;
    inputRef.current?.click();
  };

  const handleFileChange = (type: 'logo' | 'banner', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files;
    if (file) {
      handleImageUpload(type, file[0]);
    }
  };

  const handleImageDrop = (type: 'logo' | 'banner', e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(type, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

    // If the value already starts with the prefix, return as is
    if (placeholders.some(placeholder => trimmed.startsWith(placeholder))) {
      return trimmed;
    }

    // For website URLs, try to add https:// if not present
    if (placeholders.includes('https://')) {
      try {
        return new URL(`https://${trimmed}`).toString();
      } catch {
        return undefined;
      }
    }

    // For other URLs, return the full value
    return trimmed;
  };

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

    const totalSupply = Number(formData.tokenSupply);
    if (!Number.isFinite(totalSupply) || totalSupply <= 0 || !Number.isInteger(totalSupply)) {
      toast.error('Token supply must be a positive integer');
      return;
    }

    const decimals = Number(formData.decimal);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 9) {
      toast.error('Token decimals must be an integer between 0 and 9');
      return;
    }
    
    setIsDeploying(true);
    setDeploymentStep(1);
    setDeploymentProgress(0);
    
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

      const sanitizedWebsite = sanitizeUrl(formData.websiteUrl, ['https://']);
      const sanitizedTwitter = sanitizeUrl(formData.twitterUrl, ['x.com/']);
      const sanitizedTelegram = sanitizeUrl(formData.telegramUrl, ['t.me/']);

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
        tokenConfig,
      };

      await createToken(createTokenPayload);

      console.log('✅ Deploy transaction confirmed:', signatureDeployToken);
      
      // Complete deployment
      setDeploymentProgress(100);
      // Show navigation loading overlay
      setIsNavigating(true);
      toast.dismiss('deployment-progress');
      toast.success('Token deployed successfully! 🎉', {
        description: `Your token "${formData.tokenName}" (${formData.tokenSymbol.toUpperCase()}) is now live on Solana!`,
        duration: 5000
      });
      
      // Navigate to token page
      router.push(`/token/${deployResult.data.baseMint}`)
      
    } catch (error) {
      console.error('❌ Error during token deployment:', error);
      
      toast.dismiss('deployment-progress');
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('Transaction was rejected by user', {
            description: 'Please try again and approve the transaction in your wallet.'
          });
        } else if (error.message.includes('Insufficient funds')) {
          toast.error('Insufficient SOL balance for transaction', {
            description: 'Please add more SOL to your wallet and try again.'
          });
        } else if (error.message.includes('Simulation failed')) {
          toast.error('Transaction simulation failed', {
            description: 'Please check your inputs and try again.'
          });
        } else {
          toast.error(`Deployment failed: ${error.message}`, {
            description: 'Please check your inputs and try again.'
          });
        }
      } else {
        toast.error('An unexpected error occurred during deployment', {
          description: 'Please try again or contact support if the issue persists.'
        });
      }
      throw error;
    } finally {
      setIsDeploying(false);
      setIsNavigating(false);
      setDeploymentStep(1);
      setDeploymentProgress(0);
    }
  }

  return (
    <>
      <TokenCreationModal
        isVisible={isDeploying}
        currentStep={deploymentStep}
        totalSteps={7}
        stepMessage={getStepMessage(deploymentStep)}
        subMessage={getStepSubMessage(deploymentStep)}
        progress={deploymentProgress}
        tokenLogo={logoUrl || undefined}
      />
      <LoadingOverlay 
        isVisible={isNavigating}
        message="Redirecting to your token..."
        subMessage="Please wait while we take you to your token page"
      />
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 px-4">
            Make your own token
          </h1>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Supply <strong className="text-red-500">*</strong>
              </label>
              <input
                type="text"
                value={formData.tokenSupply}
                onChange={(e) => handleInputChange('tokenSupply', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decimal <strong className="text-red-500">*</strong>
              </label>
              <input
                type="text"
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
                    src={logoUrl} 
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
                  <h4 className="text-gray-700 mb-1 font-medium text-sm">Token Logo</h4>
                  <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
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
                    src={bannerUrl} 
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
                  <h4 className="font-medium text-gray-700 mb-1 text-sm">Banner image</h4>
                  <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
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
    </>
  );
}