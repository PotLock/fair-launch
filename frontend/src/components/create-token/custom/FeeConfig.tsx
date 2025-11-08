import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Progress } from '../../ui/progress';

interface FeeConfigProps {
  onNext: (data: FeeConfigData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface FeeConfigData {
  baseFeeMode: "0" | "1" | "2";
  feeSchedulerParam: {
    startingFeeBps: number;
    endingFeeBps: number;
    numberOfPeriod: number;
    totalDuration: number;
  };
}

const baseFeeModes = [
  { value: "0", label: "Fixed Fee" },
  { value: "1", label: "Linear Scheduler" },
  { value: "2", label: "Custom Scheduler" }
];

export default function FeeConfig({ 
  onNext, 
  onBack,
  onCancel, 
  currentStep = 3, 
  totalSteps = 7 
}: FeeConfigProps) {
  const [formData, setFormData] = useState<FeeConfigData>({
    baseFeeMode: "0",
    feeSchedulerParam: {
      startingFeeBps: 100,
      endingFeeBps: 50,
      numberOfPeriod: 10,
      totalDuration: 30,
    },
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof FeeConfigData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSchedulerChange = (field: keyof FeeConfigData['feeSchedulerParam'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      feeSchedulerParam: {
        ...prev.feeSchedulerParam,
        [field]: numValue
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const isSchedulerMode = formData.baseFeeMode !== "0";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Fee Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Set up your token's fee structure and scheduling.
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Base Fee Mode */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Fee Mode</h3>
            
            <div className="space-y-2">
              <label className="text-black font-medium">
                Base Fee Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.baseFeeMode}
                onChange={(e) => handleInputChange('baseFeeMode', e.target.value as "0" | "1" | "2")}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {baseFeeModes.map(mode => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                Choose how fees will be calculated and applied
              </p>
            </div>
          </div>

          {/* Fee Scheduler Parameters */}
          {isSchedulerMode && (
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-black">Fee Scheduler Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Starting Fee (BPS)
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.feeSchedulerParam.startingFeeBps}
                    onChange={(e) => handleSchedulerChange('startingFeeBps', e.target.value)}
                    className="h-12"
                    min="0"
                    max="10000"
                  />
                  <p className="text-sm text-gray-600">
                    Initial fee in basis points (1 BPS = 0.01%)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Ending Fee (BPS)
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={formData.feeSchedulerParam.endingFeeBps}
                    onChange={(e) => handleSchedulerChange('endingFeeBps', e.target.value)}
                    className="h-12"
                    min="0"
                    max="10000"
                  />
                  <p className="text-sm text-gray-600">
                    Final fee in basis points after scheduling
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Number of Periods
                  </label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.feeSchedulerParam.numberOfPeriod}
                    onChange={(e) => handleSchedulerChange('numberOfPeriod', e.target.value)}
                    className="h-12"
                    min="1"
                  />
                  <p className="text-sm text-gray-600">
                    How many periods to transition from starting to ending fee
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Total Duration (Days)
                  </label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData.feeSchedulerParam.totalDuration}
                    onChange={(e) => handleSchedulerChange('totalDuration', e.target.value)}
                    className="h-12"
                    min="1"
                  />
                  <p className="text-sm text-gray-600">
                    Total time for the fee schedule to complete
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fee Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Fee Structure</h3>
              <p className="text-sm text-gray-600">
                Fees are charged on transactions and help maintain liquidity. 
                Consider market conditions when setting fee rates.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Scheduler Benefits</h3>
              <p className="text-sm text-gray-600">
                Fee scheduling allows gradual fee reduction over time, 
                encouraging early adoption while maintaining sustainability.
              </p>
            </div>
          </div>

          {/* Fee Preview */}
          {isSchedulerMode && (
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="font-semibold text-black mb-4">Fee Schedule Preview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Starting Fee:</span>
                  <span className="text-sm font-medium">{(formData.feeSchedulerParam.startingFeeBps / 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ending Fee:</span>
                  <span className="text-sm font-medium">{(formData.feeSchedulerParam.endingFeeBps / 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{formData.feeSchedulerParam.totalDuration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Periods:</span>
                  <span className="text-sm font-medium">{formData.feeSchedulerParam.numberOfPeriod}</span>
                </div>
              </div>
            </div>
          )}
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
            type="submit"
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Continue to Vesting
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
