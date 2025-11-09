"use client"

import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface AuthorityProps {
  onNext: (data: AuthorityData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: AuthorityData;
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
  totalSteps = 7,
  initialData
}: AuthorityProps) {
  const [formData, setFormData] = useState<AuthorityData>({
    tokenUpdateAuthority: initialData?.tokenUpdateAuthority || "0",
    leftoverReceiver: initialData?.leftoverReceiver || "",
    feeClaimer: initialData?.feeClaimer || "",
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
          {/* Token Update Authority */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Token Update Authority</h3>
            
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can update the token? <strong className="text-red-500">*</strong>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
                  {tokenUpdateAuthorities.find(authority => authority.value === formData.tokenUpdateAuthority)?.label || 'Select authority'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {tokenUpdateAuthorities.map(authority => (
                    <DropdownMenuItem
                      key={authority.value}
                      onClick={() => handleInputChange('tokenUpdateAuthority', authority.value as "0" | "1" | "2" | "3" | "4")}
                    >
                      {authority.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Receiver Addresses */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Receiver Addresses</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leftover Receiver Address <strong className="text-red-500">*</strong>
                </label>
                <input
                  placeholder="Enter wallet address for leftover tokens"
                  value={formData.leftoverReceiver}
                  onChange={(e) => handleInputChange('leftoverReceiver', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Claimer Address <strong className="text-red-500">*</strong>
                </label>
                <input
                  placeholder="Enter wallet address for fee collection"
                  value={formData.feeClaimer}
                  onChange={(e) => handleInputChange('feeClaimer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  required
                />
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
            Continue to Advanced
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
