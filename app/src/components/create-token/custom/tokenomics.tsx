"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface TokenomicsProps {
  onNext: (data: TokenomicsData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface TokenomicsData {
  totalTokenSupply: number;
  tokenBaseDecimal: number;
  tokenQuoteDecimal: number;
}

export default function Tokenomics({ 
  onNext, 
  onBack,
  onCancel, 
  currentStep = 2, 
  totalSteps = 9 
}: TokenomicsProps) {
  const [formData, setFormData] = useState<TokenomicsData>({
    totalTokenSupply: 1000000,
    tokenBaseDecimal: 6,
    tokenQuoteDecimal: 6,
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof TokenomicsData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalTokenSupply > 0 && formData.tokenBaseDecimal >= 0 && formData.tokenQuoteDecimal >= 0) {
      onNext(formData);
    }
  };

  const isFormValid = formData.totalTokenSupply > 0 && formData.tokenBaseDecimal >= 0 && formData.tokenQuoteDecimal >= 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Tokenomics Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Set your token supply and decimal places.
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
          {/* Token Supply */}
          <div className="space-y-6 mb-8">
            <div className="space-y-2">
              <label className="text-black font-medium">
                Total Token Supply <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="1000000"
                value={formData.totalTokenSupply}
                onChange={(e) => handleInputChange('totalTokenSupply', e.target.value)}
                className="h-12"
                min="1"
                required
              />
              <p className="text-sm text-gray-600">
                The total number of tokens that will be created
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Token Base Decimal
                </label>
                <Input
                  type="number"
                  placeholder="6"
                  value={formData.tokenBaseDecimal}
                  onChange={(e) => handleInputChange('tokenBaseDecimal', e.target.value)}
                  className="h-12"
                  min="0"
                  max="18"
                />
                <p className="text-sm text-gray-600">
                  Decimal places for the token (0-18)
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Token Quote Decimal
                </label>
                <Input
                  type="number"
                  placeholder="6"
                  value={formData.tokenQuoteDecimal}
                  onChange={(e) => handleInputChange('tokenQuoteDecimal', e.target.value)}
                  className="h-12"
                  min="0"
                  max="18"
                />
                <p className="text-sm text-gray-600">
                  Decimal places for the quote token (0-18)
                </p>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Token Supply Info</h3>
              <p className="text-sm text-gray-600">
                Higher supply means more tokens but lower individual value. 
                Consider your token's utility and market cap goals.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Decimal Places</h3>
              <p className="text-sm text-gray-600">
                More decimals allow for finer price granularity. 
                Most tokens use 6-9 decimal places.
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
            Continue to Curve Config
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
