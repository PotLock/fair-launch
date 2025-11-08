"use client"

import React, { useState, useMemo, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';

interface VestingProps {
  onNext: (data: VestingData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: VestingData;
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
  totalSteps = 7,
  initialData
}: VestingProps) {
  const [formData, setFormData] = useState<VestingData>({
    totalLockedVestingAmount: initialData?.totalLockedVestingAmount || 20000,
    numberOfVestingPeriod: initialData?.numberOfVestingPeriod || 9,
    cliffUnlockAmount: initialData?.cliffUnlockAmount || 5000,
    totalVestingDuration: initialData?.totalVestingDuration || 9*30*24*3600,
    cliffDurationFromMigrationTime: initialData?.cliffDurationFromMigrationTime || 3*30*24*3600,
  });

  const progressPercentage = useMemo(() =>
    (currentStep / totalSteps) * 100,
    [currentStep, totalSteps]
  );

  const handleInputChange = useCallback((field: keyof VestingData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalLockedVestingAmount > 0 && formData.numberOfVestingPeriod > 0) {
      onNext(formData);
    }
  }, [formData, onNext]);

  const isFormValid = useMemo(() =>
    formData.totalLockedVestingAmount > 0 && formData.numberOfVestingPeriod > 0,
    [formData.totalLockedVestingAmount, formData.numberOfVestingPeriod]
  );

  // Memoize vesting schedule calculations
  const vestingSchedule = useMemo(() => {
    const cliffPercentage = (formData.cliffUnlockAmount / formData.totalLockedVestingAmount) * 100;
    const remainingAmount = formData.totalLockedVestingAmount - formData.cliffUnlockAmount;
    const periodAmount = remainingAmount / formData.numberOfVestingPeriod;
    const periodDuration = formData.totalVestingDuration / formData.numberOfVestingPeriod;

    return {
      cliffPercentage,
      remainingAmount,
      periodAmount,
      periodDuration
    };
  }, [
    formData.totalLockedVestingAmount,
    formData.cliffUnlockAmount,
    formData.numberOfVestingPeriod,
    formData.totalVestingDuration
  ]);

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

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full px-4 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Vesting Amount */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Vesting Amount</h3>
            
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Locked Vesting Amount <strong className="text-red-500">*</strong>
              </label>
              <input
                type="number"
                placeholder="100000"
                value={formData.totalLockedVestingAmount}
                onChange={(e) => handleInputChange('totalLockedVestingAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                min="1"
                required
              />
            </div>
          </div>

          {/* Cliff Configuration */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Cliff Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliff Unlock Amount
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={formData.cliffUnlockAmount}
                  onChange={(e) => handleInputChange('cliffUnlockAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliff Duration (Days)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={formData.cliffDurationFromMigrationTime}
                  onChange={(e) => handleInputChange('cliffDurationFromMigrationTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Vesting Schedule */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Vesting Schedule</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Vesting Periods <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="number"
                  placeholder="12"
                  value={formData.numberOfVestingPeriod}
                  onChange={(e) => handleInputChange('numberOfVestingPeriod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Vesting Duration (Days)
                </label>
                <input
                  type="number"
                  placeholder="365"
                  value={formData.totalVestingDuration}
                  onChange={(e) => handleInputChange('totalVestingDuration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="1"
                />
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
                  <div className="text-xs text-gray-500">{formData.cliffUnlockAmount.toLocaleString()} tokens ({vestingSchedule.cliffPercentage.toFixed(1)}%)</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Vesting Periods:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{formData.numberOfVestingPeriod} periods</div>
                  <div className="text-xs text-gray-500">{vestingSchedule.periodAmount.toLocaleString()} tokens per period</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Period Duration:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{vestingSchedule.periodDuration.toFixed(1)} days per period</div>
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
            type="submit"
            disabled={!isFormValid}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors flex items-center justify-center ${
              !isFormValid
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
            }`}
          >
            Continue to Liquidity
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}