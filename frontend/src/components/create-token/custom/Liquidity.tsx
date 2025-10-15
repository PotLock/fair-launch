import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Progress } from '../../ui/progress';
import { cn } from '../../../lib/utils';

interface LiquidityProps {
  onNext: (data: LiquidityData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface LiquidityData {
  partnerLpPercentage: number;
  creatorLpPercentage: number;
  partnerLockedLpPercentage: number;
  creatorLockedLpPercentage: number;
}

export default function Liquidity({ 
  onNext, 
  onBack,
  onCancel, 
  currentStep = 5, 
  totalSteps = 7 
}: LiquidityProps) {
  const [formData, setFormData] = useState<LiquidityData>({
    partnerLpPercentage: 20,
    creatorLpPercentage: 30,
    partnerLockedLpPercentage: 50,
    creatorLockedLpPercentage: 70,
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof LiquidityData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  // Calculate totals and validation
  const totalLpPercentage = formData.partnerLpPercentage + formData.creatorLpPercentage;
  const isLpValid = totalLpPercentage <= 100;
  
  const partnerUnlockedLp = formData.partnerLpPercentage * (100 - formData.partnerLockedLpPercentage) / 100;
  const partnerLockedLp = formData.partnerLpPercentage * formData.partnerLockedLpPercentage / 100;
  const creatorUnlockedLp = formData.creatorLpPercentage * (100 - formData.creatorLockedLpPercentage) / 100;
  const creatorLockedLp = formData.creatorLpPercentage * formData.creatorLockedLpPercentage / 100;

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
          {/* LP Distribution */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">LP Distribution</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Partner LP Percentage
                </label>
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.partnerLpPercentage}
                  onChange={(e) => handleInputChange('partnerLpPercentage', e.target.value)}
                  className="h-12"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-600">
                  Percentage of LP tokens allocated to partners
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Creator LP Percentage
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.creatorLpPercentage}
                  onChange={(e) => handleInputChange('creatorLpPercentage', e.target.value)}
                  className="h-12"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-600">
                  Percentage of LP tokens allocated to creator
                </p>
              </div>
            </div>

            {/* Total LP Validation */}
            <div className={cn(
              "p-4 rounded-lg",
              isLpValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total LP Distribution:</span>
                <span className={cn(
                  "text-sm font-bold",
                  isLpValid ? "text-green-700" : "text-red-700"
                )}>
                  {totalLpPercentage.toFixed(1)}%
                </span>
              </div>
              {!isLpValid && (
                <p className="text-xs text-red-600 mt-1">
                  Total LP percentage cannot exceed 100%
                </p>
              )}
            </div>
          </div>

          {/* LP Locking */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">LP Locking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Partner Locked LP Percentage
                </label>
                <Input
                  type="number"
                  placeholder="50"
                  value={formData.partnerLockedLpPercentage}
                  onChange={(e) => handleInputChange('partnerLockedLpPercentage', e.target.value)}
                  className="h-12"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-600">
                  Percentage of partner LP tokens that will be locked
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Creator Locked LP Percentage
                </label>
                <Input
                  type="number"
                  placeholder="70"
                  value={formData.creatorLockedLpPercentage}
                  onChange={(e) => handleInputChange('creatorLockedLpPercentage', e.target.value)}
                  className="h-12"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-600">
                  Percentage of creator LP tokens that will be locked
                </p>
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
                    <span className="font-medium">{partnerUnlockedLp.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Locked:</span>
                    <span className="font-medium">{partnerLockedLp.toFixed(1)}%</span>
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
                    <span className="font-medium">{creatorUnlockedLp.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Locked:</span>
                    <span className="font-medium">{creatorLockedLp.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Unlocked LP:</span>
                  <span>{(partnerUnlockedLp + creatorUnlockedLp).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Locked LP:</span>
                  <span>{(partnerLockedLp + creatorLockedLp).toFixed(1)}%</span>
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
            disabled={!isLpValid}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Continue to Authority
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
