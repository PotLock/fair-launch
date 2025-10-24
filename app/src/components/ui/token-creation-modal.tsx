"use client"

import React from 'react';

interface TokenCreationModalProps {
  isVisible: boolean;
  currentStep: number;
  totalSteps: number;
  stepMessage: string;
  subMessage?: string;
  progress: number; // 0-100
  tokenLogo?: string; // URL or path to token logo
}

const steps = [
  { id: 1, name: "Preparing Configuration", description: "Setting up token parameters" },
  { id: 2, name: "Sending Configuration", description: "Submitting configuration transaction" },
  { id: 3, name: "Confirming Configuration", description: "Waiting for confirmation" },
  { id: 4, name: "Deploying Token", description: "Creating your token on blockchain" },
  { id: 5, name: "Confirming Deployment", description: "Finalizing token creation" },
  { id: 6, name: "Saving Details", description: "Storing token information" },
  { id: 7, name: "Redirecting", description: "Taking you to your token page" }
];

export default function TokenCreationModal({ 
  isVisible, 
  currentStep, 
  totalSteps, 
  stepMessage, 
  subMessage,
  progress,
  tokenLogo 
}: TokenCreationModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-[360px] w-full shadow-2xl">
        <div className="text-center">
          {/* Token Logo */}
          {tokenLogo && (
            <div className="flex justify-center mb-4">
              <img 
                src={tokenLogo} 
                alt="Token Logo" 
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (target && fallback) {
                    target.style.display = 'none';
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-lg font-bold" style={{ display: 'none' }}>
                T
              </div>
            </div>
          )}
          
          {/* Current Step Message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stepMessage}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {subMessage}
          </p>

          {/* Horizontal Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {Math.round(progress)}% complete
          </p>

          {/* Warning Message */}
          <p className="text-sm text-gray-500">
            Please don't close this window. Deployment typically takes 2-5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
