"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface AuthorityProps {
  onNext: (data: AuthorityData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface AuthorityData {
  tokenUpdateAuthority: "0" | "1" | "2" | "3" | "4";
  leftoverReceiver: string;
  feeClaimer: string;
}

const tokenUpdateAuthorities = [
  { value: "0", label: "Creator Only" },
  { value: "1", label: "Multi-sig Wallet" },
  { value: "2", label: "DAO Governance" },
  { value: "3", label: "Community Vote" },
  { value: "4", label: "No Updates" }
];

export default function Authority({ 
  onNext, 
  onBack,
  onCancel, 
  currentStep = 6, 
  totalSteps = 7 
}: AuthorityProps) {
  const [formData, setFormData] = useState<AuthorityData>({
    tokenUpdateAuthority: "0",
    leftoverReceiver: "",
    feeClaimer: "",
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof AuthorityData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const isFormValid = formData.leftoverReceiver.trim() !== '' && formData.feeClaimer.trim() !== '';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Authority Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Set up token update authority and receiver addresses.
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
          {/* Token Update Authority */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Token Update Authority</h3>
            
            <div className="space-y-2">
              <label className="text-black font-medium">
                Who can update the token? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tokenUpdateAuthority}
                onChange={(e) => handleInputChange('tokenUpdateAuthority', e.target.value as "0" | "1" | "2" | "3" | "4")}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {tokenUpdateAuthorities.map(authority => (
                  <option key={authority.value} value={authority.value}>{authority.label}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                Choose who has the authority to update token parameters
              </p>
            </div>
          </div>

          {/* Receiver Addresses */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Receiver Addresses</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Leftover Receiver Address <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter wallet address for leftover tokens"
                  value={formData.leftoverReceiver}
                  onChange={(e) => handleInputChange('leftoverReceiver', e.target.value)}
                  className="h-12"
                  required
                />
                <p className="text-sm text-gray-600">
                  Address that will receive any leftover tokens after distribution
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-black font-medium">
                  Fee Claimer Address <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter wallet address for fee collection"
                  value={formData.feeClaimer}
                  onChange={(e) => handleInputChange('feeClaimer', e.target.value)}
                  className="h-12"
                  required
                />
                <p className="text-sm text-gray-600">
                  Address that will receive collected fees from transactions
                </p>
              </div>
            </div>
          </div>

          {/* Authority Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Update Authority</h3>
              <p className="text-sm text-gray-600">
                Token update authority determines who can modify token parameters 
                like metadata, supply, or other configurations after deployment.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Receiver Addresses</h3>
              <p className="text-sm text-gray-600">
                These addresses will receive leftover tokens and collected fees. 
                Make sure to use secure, accessible wallet addresses.
              </p>
            </div>
          </div>

          {/* Authority Type Details */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-black mb-4">Authority Type Details</h3>
            <div className="space-y-3">
              {formData.tokenUpdateAuthority === "0" && (
                <div className="text-sm text-gray-700">
                  <strong>Creator Only:</strong> Only the token creator can update token parameters. 
                  This provides maximum control but requires trust in the creator.
                </div>
              )}
              {formData.tokenUpdateAuthority === "1" && (
                <div className="text-sm text-gray-700">
                  <strong>Multi-sig Wallet:</strong> Updates require approval from multiple signers. 
                  This provides security through distributed control.
                </div>
              )}
              {formData.tokenUpdateAuthority === "2" && (
                <div className="text-sm text-gray-700">
                  <strong>DAO Governance:</strong> Updates are decided through decentralized governance. 
                  Token holders vote on proposed changes.
                </div>
              )}
              {formData.tokenUpdateAuthority === "3" && (
                <div className="text-sm text-gray-700">
                  <strong>Community Vote:</strong> Updates require community voting. 
                  This ensures community input on important decisions.
                </div>
              )}
              {formData.tokenUpdateAuthority === "4" && (
                <div className="text-sm text-gray-700">
                  <strong>No Updates:</strong> Token parameters cannot be changed after deployment. 
                  This provides maximum immutability and trustlessness.
                </div>
              )}
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please verify all addresses carefully. These addresses will have significant control 
                  over your token. Consider using multi-sig wallets for enhanced security.
                </p>
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
            type="submit"
            disabled={!isFormValid}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Continue to Advanced
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
