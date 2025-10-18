"use client"

import { useState } from "react";

interface QuickStartProps {
  onMethodSelect: (method: 'quick' | 'custom') => void;
}

export default function QuickStart({ onMethodSelect }: QuickStartProps) {
  const [selectedMethod, setSelectedMethod] = useState<'quick' | 'custom'>('quick');

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4 px-4">
            How would you like to create your token?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Choose your preferred creation experience
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
          {/* Quick Mint Card */}
          <div 
            className={`relative border rounded-lg p-4 sm:p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'quick' 
                ? 'border-red-500 bg-red-50/50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod('quick')}
          >
            {/* Icon */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="relative">
                <img src="/images/quick-mint.svg" className="w-16 h-16" alt="Quick Mint" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black">Quick Mint</h3>
                <span className="inline-block px-4 py-1 text-xs font-semibold text-green-500 bg-green-100 rounded-full">
                  Recommended
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Fast track token creation with sensible defaults. Perfect for getting started quickly.
            </p>

            {/* Features */}
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Standard meme coin setup
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                1B token supply
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Mint directly to your wallet
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Skip complex configurations
              </li>
            </ul>
          </div>

          {/* Custom Creation Card */}
          <div 
            className={`relative border rounded-lg p-4 sm:p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'custom' 
                ? 'border-red-500 bg-red-50/50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod('custom')}
          >
            {/* Icon */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="relative">
                <img src="/images/custom-mint.svg" className="w-14 h-14" alt="Custom Mint" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-black">Custom Creation</h3>
                <span className="inline-block px-4 py-1 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">
                  Advanced
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Full control over every aspect of your token. Configure allocations, fees, and advanced settings.
            </p>

            {/* Features */}
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Complete customization
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Token allocations & vesting
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Sale method configuration
              </li>
              <li className="flex items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                Advanced security settings
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <button className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onMethodSelect(selectedMethod)}
            className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
          >
            Continue to Token Creation
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}