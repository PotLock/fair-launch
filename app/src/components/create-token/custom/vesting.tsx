"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface VestingProps {
  onNext: (data: VestingData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface VestingData {
  totalLockedVestingAmount: number;
  numberOfVestingPeriod: number;
  cliffUnlockAmount: number;
  totalVestingDuration: number;
  cliffDurationFromMigrationTime: number;
}

export default function Vesting({ 
  onNext, 
  onBack,
  onCancel, 
  currentStep = 4, 
  totalSteps = 7 
}: VestingProps) {
  const [formData, setFormData] = useState<VestingData>({
    totalLockedVestingAmount: 100000,
    numberOfVestingPeriod: 12,
    cliffUnlockAmount: 10000,
    totalVestingDuration: 365,
    cliffDurationFromMigrationTime: 30,
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof VestingData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalLockedVestingAmount > 0 && formData.numberOfVestingPeriod > 0) {
      onNext(formData);
    }
  };

  const isFormValid = formData.totalLockedVestingAmount > 0 && formData.numberOfVestingPeriod > 0;

  // Calculate vesting schedule preview
  const cliffPercentage = (formData.cliffUnlockAmount / formData.totalLockedVestingAmount) * 100;
  const remainingAmount = formData.totalLockedVestingAmount - formData.cliffUnlockAmount;
  const periodAmount = remainingAmount / formData.numberOfVestingPeriod;
  const periodDuration = formData.totalVestingDuration / formData.numberOfVestingPeriod;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Vesting Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Set up token vesting schedule and cliff periods.
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
          {/* Vesting Amount */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Vesting Amount</h3>
            
            <div className="space-y-2">
              <label className="text-black font-medium">
                Total Locked Vesting Amount <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="100000"
                value={formData.totalLockedVestingAmount}
                onChange={(e) => handleInputChange('totalLockedVestingAmount', e.target.value)}
                className="h-12"
                min="1"
                required
              />
              <p className="text-sm text-gray-600">
                Total number of tokens to be vested
              </p>
            </div>
          </div>

          {/* Cliff Configuration */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Cliff Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Cliff Unlock Amount
                </label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.cliffUnlockAmount}
                  onChange={(e) => handleInputChange('cliffUnlockAmount', e.target.value)}
                  className="h-12"
                  min="0"
                />
                <p className="text-sm text-gray-600">
                  Tokens unlocked immediately at cliff period
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Cliff Duration (Days)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.cliffDurationFromMigrationTime}
                  onChange={(e) => handleInputChange('cliffDurationFromMigrationTime', e.target.value)}
                  className="h-12"
                  min="0"
                />
                <p className="text-sm text-gray-600">
                  Days from migration until cliff unlock
                </p>
              </div>
            </div>
          </div>

          {/* Vesting Schedule */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Vesting Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Number of Vesting Periods <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="12"
                  value={formData.numberOfVestingPeriod}
                  onChange={(e) => handleInputChange('numberOfVestingPeriod', e.target.value)}
                  className="h-12"
                  min="1"
                  required
                />
                <p className="text-sm text-gray-600">
                  How many periods to distribute remaining tokens
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Total Vesting Duration (Days)
                </label>
                <Input
                  type="number"
                  placeholder="365"
                  value={formData.totalVestingDuration}
                  onChange={(e) => handleInputChange('totalVestingDuration', e.target.value)}
                  className="h-12"
                  min="1"
                />
                <p className="text-sm text-gray-600">
                  Total time for complete vesting
                </p>
              </div>
            </div>
          </div>

          {/* Vesting Schedule Preview */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-black mb-4">Vesting Schedule Preview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cliff Period:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{formData.cliffDurationFromMigrationTime} days</div>
                  <div className="text-xs text-gray-500">{formData.cliffUnlockAmount.toLocaleString()} tokens ({cliffPercentage.toFixed(1)}%)</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Vesting Periods:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{formData.numberOfVestingPeriod} periods</div>
                  <div className="text-xs text-gray-500">{periodAmount.toLocaleString()} tokens per period</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Period Duration:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{periodDuration.toFixed(1)} days per period</div>
                  <div className="text-xs text-gray-500">Total: {formData.totalVestingDuration} days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Cliff Period</h3>
              <p className="text-sm text-gray-600">
                A cliff period prevents immediate token unlocks, ensuring commitment 
                from token holders before any tokens are released.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Vesting Benefits</h3>
              <p className="text-sm text-gray-600">
                Gradual token release helps prevent market dumping and 
                encourages long-term participation in the project.
              </p>
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
            type="submit"
            disabled={!isFormValid}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Continue to Liquidity
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}