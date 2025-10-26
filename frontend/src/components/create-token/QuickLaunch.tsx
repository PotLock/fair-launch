import { useState, useRef } from "react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { DbcConfig, LaunchClient, TokenMetadata} from "@cookedbusiness/halfbaked-sdk";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "../../lib/sol";
import { NATIVE_MINT } from "@solana/spl-token";
import { uploadImage } from "../../lib/api";
interface QuickLaunchProps {
  onCancel: () => void;
}

export default function QuickLaunch({ onCancel }: QuickLaunchProps) {
  const walletSol = useWallet()
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
    if (!logoUrl) {
      toast.error('Token logo is required');
      return;
    }
    
    setIsDeploying(true);
   
    
    try {
      console.log('🚀 Starting token deployment...');
      console.log('Wallet public key:', publicKey.toString());
      
      toast.loading('Starting token deployment...', {
        id: 'deployment-progress'
      });

      const connection = new Connection(getRpcSOLEndpoint());
      const client = new LaunchClient(connection);
      
      const metadata: TokenMetadata = {
        imageUri: logoUrl || '',
        description: formData.description,
        website: formData.websiteUrl,
        twitter: formData.twitterUrl,
        telegram: formData.telegramUrl
      };

      // Configure DBC parameters
      const dbcConfig: DbcConfig = {
          rpcUrl: getRpcSOLEndpoint(), // Required: RPC URL for Solana network connection
          computeUnitPriceMicroLamports: 100000, // Required: Compute unit price in micro lamports (0.001 SOL per compute unit)
          quoteMint: NATIVE_MINT.toString(), // Required: Quote token mint address (SOL, USDC, or any other token)
          dbcConfig: {
              // Bonding curve configuration mode
              buildCurveMode: 0, // 0 - buildCurve | 1 - buildCurveWithMarketCap | 2 - buildCurveWithTwoSegments | 3 - buildCurveWithLiquidityWeights
              
              // Parameters for buildCurveMode: 0 (buildCurve)
              percentageSupplyOnMigration: 20, // Percentage of total token supply to be migrated to DEX
              migrationQuoteThreshold: 10, // Migration quote threshold needed to migrate the DBC token pool
              
              // Token supply and migration settings
              totalTokenSupply: 1000000000, // Total token supply (not in lamports) - 1 billion tokens
              migrationOption: 1, // 0 - Migrate to DAMM v1 | 1 - Migrate to DAMM v2
              
              // Token decimal configuration
              tokenBaseDecimal: 6, // Token base decimal places
              tokenQuoteDecimal: 6, // Token quote decimal places (should match quote token decimals)
              
              // Vesting configuration (currently disabled)
              lockedVestingParam: {
                  totalLockedVestingAmount: 0, // Total locked vesting amount (not in lamports)
                  numberOfVestingPeriod: 0, // Number of vesting periods
                  cliffUnlockAmount: 0, // Cliff unlock amount (not in lamports)
                  totalVestingDuration: 0, // Total vesting duration (in seconds)
                  cliffDurationFromMigrationTime: 0 // Cliff duration from migration time (in seconds)
              },
              
              // Fee configuration
              baseFeeParams: {
                  baseFeeMode: 0, // 0 - Fee Scheduler: Linear | 1 - Fee Scheduler: Exponential | 2 - Rate Limiter
                  feeSchedulerParam: {
                      startingFeeBps: 100, // Starting fee in basis points (max 99% fee = 9900 bps)
                      endingFeeBps: 100, // Ending fee in basis points (minimum 0.01% fee = 1 bps)
                      numberOfPeriod: 0, // Number of fee periods
                      totalDuration: 0 // Total duration for fee changes (in seconds if activationType is 1)
                  }
              },
              
              // Dynamic fee settings
              dynamicFeeEnabled: true, // If true, dynamic fee will add 20% of minimum base fee to the total fee
              activationType: 1, // 0 - Slot based activation | 1 - Timestamp based activation
              collectFeeMode: 0, // 0 - Collect fees in Quote Token | 1 - Collect fees in Output Token
              
              // Migration fee options
              migrationFeeOption: 3, // 0 - LP Fee 0.25% | 1 - LP Fee 0.3% | 2 - LP Fee 1% | 3 - LP Fee 2% | 4 - LP Fee 4% | 5 - LP Fee 6%
              
              // Token type
              tokenType: 0, // 0 - SPL Token | 1 - Token 2022
              
              // Liquidity provider (LP) distribution percentages
              partnerLpPercentage: 100, // Partner claimable LP percentage (withdrawable LP once pool migrates)
              creatorLpPercentage: 0, // Creator claimable LP percentage (withdrawable LP once pool migrates)
              partnerLockedLpPercentage: 0, // Partner locked LP percentage (permanently locked LP once pool migrates)
              creatorLockedLpPercentage: 0, // Creator locked LP percentage (permanently locked LP once pool migrates)
              
              // Trading fee sharing
              creatorTradingFeePercentage: 0, // Bonding curve trading fee sharing (0% to 100%) - 0% means all trading fees go to the partner
              
              // Leftover tokens
              leftover: 0, // Leftover tokens in the bonding curve (claimable once pool migrates)
              
              // Token authority settings
              tokenUpdateAuthority: 1, // 0 - CreatorUpdateAuthority | 1 - Immutable | 2 - PartnerUpdateAuthority | 3 - CreatorUpdateAndMintAuthority | 4 - PartnerUpdateAndMintAuthority
              
              // Migration fee configuration
              migrationFee: {
                  feePercentage: 0, // Percentage of fee taken from migration quote threshold once pool migrates (0% to 50%)
                  creatorFeePercentage: 0 // Percentage of the migrationFee.feePercentage claimable by creator (0% to 100%)
              },
              
              // Addresses for leftover tokens and fee claiming
              leftoverReceiver: publicKey.toString(), // Address to receive leftover tokens
              feeClaimer: publicKey.toString() // Address to claim trading fees
          },
          dbcPool: {
              name: formData.tokenName, // Token name
              symbol: formData.tokenSymbol, // Token symbol
              metadata: metadata // Token metadata (image, description, website, social links)
          }
      };

      const quoteMint = new PublicKey(NATIVE_MINT.toString());
      const baseMint = Keypair.generate();
      const dbcConfigKeypair = Keypair.generate();

      // Get latest blockhash once
      const { blockhash } = await connection.getLatestBlockhash();

     
      toast.loading('Creating bonding curve configuration...', {
        id: 'deployment-progress'
      });
      
      const txDBCConfig = await client.createDbcConfig(
        dbcConfig,
        publicKey,
        dbcConfigKeypair,
        quoteMint
      );

      if (!(txDBCConfig instanceof Transaction)) {
        throw new Error('txDBCConfig is not a valid Transaction object');
      }
      
      // Set transaction properties for wallet adapter
      txDBCConfig.feePayer = publicKey;
      txDBCConfig.recentBlockhash = blockhash;
      
      // Partial sign with dbcConfigKeypair (required for config creation)
      txDBCConfig.partialSign(dbcConfigKeypair);
      
      // Simulate transaction first to catch errors early
      try {
        const simulation = await connection.simulateTransaction(txDBCConfig);
        if (simulation.value.err) {
          console.error('❌ Simulation error:', simulation.value.err);
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        console.log('✅ Simulation successful!');
      } catch (simError) {
        console.error('❌ Simulation failed:', simError);
        throw simError;
      }
      
     
      toast.loading('Sending configuration transaction...', {
        id: 'deployment-progress'
      });
      
      const signatureDBCConfig = await sendTransaction(
        txDBCConfig,
        connection,
        {
          skipPreflight: false,
          preflightCommitment: 'processed'
        }
      );
    
     
      toast.loading('Confirming configuration transaction...', {
        id: 'deployment-progress'
      });
      
      await connection.confirmTransaction(signatureDBCConfig, 'confirmed');

      toast.loading('Deploying token...', {
        id: 'deployment-progress'
      });
      
      const txCreateToken = await client.deployToken(dbcConfig,publicKey, baseMint, dbcConfigKeypair);

      txCreateToken.feePayer = publicKey;
      txCreateToken.recentBlockhash = blockhash;
      
      // Partial sign with baseMint (required for token creation)
      txCreateToken.partialSign(baseMint);
      toast.loading('Sending token deployment transaction...', {
        id: 'deployment-progress'
      });

      const signatureCreateToken = await sendTransaction(
        txCreateToken,
        connection,
        {
          skipPreflight: false,
          preflightCommitment: 'processed'
        }
      );

      toast.loading('Confirming token deployment...', {
        id: 'deployment-progress'
      });

      await connection.confirmTransaction(signatureCreateToken, 'confirmed');

      console.log('✅ Transaction confirmed:', signatureCreateToken);
      
      toast.dismiss('deployment-progress');
      toast.success('Token deployed successfully! 🎉', {
        description: `Your token "${formData.tokenName}" (${formData.tokenSymbol}) is now live on Solana!`,
        duration: 5000
      });
      
      
    } catch (error) {
      console.error('❌ Error during token deployment:', error);
      
      toast.dismiss('deployment-progress');
      
      // More specific error messages
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
    }
  }

  return (
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
                value={formData.tokenSymbol}
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
              <input
                type="text"
                value={formData.twitterUrl}
                onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <input
                type="text"
                value={formData.telegramUrl}
                onChange={(e) => handleInputChange('telegramUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <button 
            onClick={onCancel}
            disabled={isDeploying}
            className={`w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg transition-colors ${
              isDeploying 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={handleDeployToken} 
            disabled={isDeploying}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors flex items-center justify-center ${
              isDeploying
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isDeploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {'Deploying...'}
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
  );
}