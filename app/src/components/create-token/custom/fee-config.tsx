"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface FeeConfigProps {
  onNext: (data: FeeConfigData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: FeeConfigData;
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
  totalSteps = 7,
  initialData
}: FeeConfigProps) {
  const [formData, setFormData] = useState<FeeConfigData>({
    baseFeeMode: initialData?.baseFeeMode || "0",
    feeSchedulerParam: {
      startingFeeBps: initialData?.feeSchedulerParam?.startingFeeBps || 100,
      endingFeeBps: initialData?.feeSchedulerParam?.endingFeeBps || 100,
      numberOfPeriod: initialData?.feeSchedulerParam?.numberOfPeriod || 10,
      totalDuration: initialData?.feeSchedulerParam?.totalDuration || 3600,
    },
  });

  const progressPercentage = useMemo(() =>
    (currentStep / totalSteps) * 100,
    [currentStep, totalSteps]
  );

  const handleInputChange = useCallback((field: keyof FeeConfigData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSchedulerChange = useCallback((field: keyof FeeConfigData['feeSchedulerParam'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      feeSchedulerParam: {
        ...prev.feeSchedulerParam,
        [field]: numValue
      }
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  }, [formData, onNext]);

  const isSchedulerMode = useMemo(() =>
    formData.baseFeeMode !== "0",
    [formData.baseFeeMode]
  );

  const feePreview = useMemo(() => ({
    startingFeePercent: (formData.feeSchedulerParam.startingFeeBps / 100).toFixed(2),
    endingFeePercent: (formData.feeSchedulerParam.endingFeeBps / 100).toFixed(2),
  }), [formData.feeSchedulerParam.startingFeeBps, formData.feeSchedulerParam.endingFeeBps]);

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
          {/* Base Fee Mode */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Fee Mode</h3>
            
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fee Mode <strong className="text-red-500">*</strong>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
                  {baseFeeModes.find(mode => mode.value === formData.baseFeeMode)?.label || 'Select mode'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {baseFeeModes.map(mode => (
                    <DropdownMenuItem
                      key={mode.value}
                      onClick={() => handleInputChange('baseFeeMode', mode.value as "0" | "1" | "2")}
                    >
                      {mode.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Fee Scheduler Parameters */}
          {isSchedulerMode && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Fee Scheduler Parameters</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Fee (BPS)
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.feeSchedulerParam.startingFeeBps}
                    onChange={(e) => handleSchedulerChange('startingFeeBps', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="0"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ending Fee (BPS)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.feeSchedulerParam.endingFeeBps}
                    onChange={(e) => handleSchedulerChange('endingFeeBps', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Periods
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.feeSchedulerParam.numberOfPeriod}
                    onChange={(e) => handleSchedulerChange('numberOfPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Duration (Days)
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.feeSchedulerParam.totalDuration}
                    onChange={(e) => handleSchedulerChange('totalDuration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="1"
                  />
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
                  <span className="text-sm font-medium">{feePreview.startingFeePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ending Fee:</span>
                  <span className="text-sm font-medium">{feePreview.endingFeePercent}%</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg transition-colors hover:bg-red-600 flex items-center justify-center"
          >
            Continue to Vesting
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
