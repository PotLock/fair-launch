"use client"

import React, { useState, useMemo, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { InfoTooltip, DBC_TOOLTIPS } from '@/components/ui/info-tooltip';

interface LiquidityProps {
  onNext: (data: LiquidityData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: LiquidityData;
}

export interface LiquidityData {
  partnerLpPercentage: number;
  creatorLpPercentage: number;
  partnerLockedLpPercentage: number;
  creatorLockedLpPercentage: number;
  creatorTradingFeePercentage: number;
  leftover: number;
  // Migration Fee (optional)
  migrationFee?: {
    feePercentage: number;
    creatorFeePercentage: number;
  };
}

export default function Liquidity({
  onNext,
  onBack,
  onCancel,
  currentStep = 5,
  totalSteps = 7,
  initialData
}: LiquidityProps) {
  const [formData, setFormData] = useState<LiquidityData>({
    partnerLpPercentage: initialData?.partnerLpPercentage || 50,
    creatorLpPercentage: initialData?.creatorLpPercentage || 50,
    partnerLockedLpPercentage: initialData?.partnerLockedLpPercentage || 0,
    creatorLockedLpPercentage: initialData?.creatorLockedLpPercentage || 0,
    creatorTradingFeePercentage: initialData?.creatorTradingFeePercentage || 50,
    leftover: initialData?.leftover || 0,
    migrationFee: initialData?.migrationFee || {
      feePercentage: 0,
      creatorFeePercentage: 0,
    },
  });

  const progressPercentage = useMemo(() =>
    (currentStep / totalSteps) * 100,
    [currentStep, totalSteps]
  );

  const handleInputChange = useCallback((field: keyof LiquidityData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  }, []);

  const handleMigrationFeeChange = useCallback((field: 'feePercentage' | 'creatorFeePercentage', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      migrationFee: {
        ...prev.migrationFee!,
        [field]: numValue
      }
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  }, [formData, onNext]);

  // Memoize liquidity calculations
  const liquidityCalculations = useMemo(() => {
    const totalLpPercentage = formData.partnerLpPercentage + formData.creatorLpPercentage;
    const isLpValid = totalLpPercentage <= 100;

    const partnerUnlockedLp = formData.partnerLpPercentage * (100 - formData.partnerLockedLpPercentage) / 100;
    const partnerLockedLp = formData.partnerLpPercentage * formData.partnerLockedLpPercentage / 100;
    const creatorUnlockedLp = formData.creatorLpPercentage * (100 - formData.creatorLockedLpPercentage) / 100;
    const creatorLockedLp = formData.creatorLpPercentage * formData.creatorLockedLpPercentage / 100;

    return {
      totalLpPercentage,
      isLpValid,
      partnerUnlockedLp,
      partnerLockedLp,
      creatorUnlockedLp,
      creatorLockedLp
    };
  }, [
    formData.partnerLpPercentage,
    formData.creatorLpPercentage,
    formData.partnerLockedLpPercentage,
    formData.creatorLockedLpPercentage
  ]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Liquidity Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Configure liquidity pool distribution and locking percentages.
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
          {/* LP Distribution */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">LP Distribution</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Partner LP Percentage
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.partnerLpPercentage} />
                </label>
                <input
                  type="number"
                  placeholder="20"
                  value={formData.partnerLpPercentage}
                  onChange={(e) => handleInputChange('partnerLpPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Creator LP Percentage
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.creatorLpPercentage} />
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={formData.creatorLpPercentage}
                  onChange={(e) => handleInputChange('creatorLpPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Total LP Validation */}
            <div className={cn(
              "p-4 rounded-lg mt-2",
              liquidityCalculations.isLpValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total LP Distribution:</span>
                <span className={cn(
                  "text-sm font-bold",
                  liquidityCalculations.isLpValid ? "text-green-700" : "text-red-700"
                )}>
                  {liquidityCalculations.totalLpPercentage.toFixed(1)}%
                </span>
              </div>
              {!liquidityCalculations.isLpValid && (
                <p className="text-xs text-red-600 mt-1">
                  Total LP percentage cannot exceed 100%
                </p>
              )}
            </div>
          </div>

          {/* LP Locking */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">LP Locking</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Partner Locked LP Percentage
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.partnerLockedLpPercentage} />
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={formData.partnerLockedLpPercentage}
                  onChange={(e) => handleInputChange('partnerLockedLpPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Creator Locked LP Percentage
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.creatorLockedLpPercentage} />
                </label>
                <input
                  type="number"
                  placeholder="70"
                  value={formData.creatorLockedLpPercentage}
                  onChange={(e) => handleInputChange('creatorLockedLpPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Trading Fee & Leftover */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Trading Fee & Leftover</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Creator Trading Fee Percentage (%)
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.creatorTradingFeePercentage} />
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={formData.creatorTradingFeePercentage}
                  onChange={(e) => handleInputChange('creatorTradingFeePercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">0% = all fees go to partner</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Leftover Amount
                  <InfoTooltip content={DBC_TOOLTIPS.lpDistribution.leftover} />
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.leftover}
                  onChange={(e) => handleInputChange('leftover', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Claimable after pool migrates</p>
              </div>
            </div>
          </div>

          {/* Migration Fee */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Migration Fee (Optional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Migration Fee Percentage (%)
                  <InfoTooltip content={DBC_TOOLTIPS.migrationFee.feePercentage} />
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.migrationFee?.feePercentage || 0}
                  onChange={(e) => handleMigrationFeeChange('feePercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="50"
                />
                <p className="text-xs text-gray-500 mt-1">Fee taken from migration threshold (0-50%)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Creator Migration Fee Percentage (%)
                  <InfoTooltip content={DBC_TOOLTIPS.migrationFee.creatorFeePercentage} />
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.migrationFee?.creatorFeePercentage || 0}
                  onChange={(e) => handleMigrationFeeChange('creatorFeePercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Creator's share of migration fee (0-100%)</p>
              </div>
            </div>
          </div>

          {/* LP Distribution Preview */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-black mb-4">LP Distribution Preview</h3>
            <div className="space-y-4">
              {/* Partner LP Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Partner LP ({formData.partnerLpPercentage}%)</span>
                  <span className="text-sm text-gray-600">{formData.partnerLpPercentage}% of total LP</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Unlocked:</span>
                    <span className="font-medium">{liquidityCalculations.partnerUnlockedLp.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Locked:</span>
                    <span className="font-medium">{liquidityCalculations.partnerLockedLp.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Creator LP Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Creator LP ({formData.creatorLpPercentage}%)</span>
                  <span className="text-sm text-gray-600">{formData.creatorLpPercentage}% of total LP</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Unlocked:</span>
                    <span className="font-medium">{liquidityCalculations.creatorUnlockedLp.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Locked:</span>
                    <span className="font-medium">{liquidityCalculations.creatorLockedLp.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Unlocked LP:</span>
                  <span>{(liquidityCalculations.partnerUnlockedLp + liquidityCalculations.creatorUnlockedLp).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Locked LP:</span>
                  <span>{(liquidityCalculations.partnerLockedLp + liquidityCalculations.creatorLockedLp).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">LP Distribution</h3>
              <p className="text-sm text-gray-600">
                LP tokens represent ownership in the liquidity pool. 
                Distribute them carefully between partners and creators.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">LP Locking</h3>
              <p className="text-sm text-gray-600">
                Locking LP tokens prevents immediate withdrawal and 
                helps maintain liquidity stability in the pool.
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
            disabled={!liquidityCalculations.isLpValid}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors flex items-center justify-center ${
              !liquidityCalculations.isLpValid
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
            }`}
          >
            Continue to Authority
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
