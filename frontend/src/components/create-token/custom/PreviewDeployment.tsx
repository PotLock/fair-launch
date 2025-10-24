import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { CustomMintData } from '../../../types';

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
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleCreateToken = () => {

  };

  return (
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
      <div className="px-8 mb-8">
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
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Token Info Preview */}
          {formData.tokenInfo && (
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Token Information</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{formData.tokenInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Symbol:</span>
                    <p className="font-medium">{formData.tokenInfo.symbol}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-600">Description:</span>
                    <p className="font-medium">{formData.tokenInfo.description || 'No description'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tokenomics Preview */}
          {formData.tokenInfo && (
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Tokenomics</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Vesting Configuration</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Liquidity Distribution</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Authority Settings</h3>
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
        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-8 py-3"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-8 py-3"
            >
              Cancel
            </Button>
          </div>
          <Button
            type="button"
            onClick={handleCreateToken}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Create Token
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
