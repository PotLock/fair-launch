"use client"

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QuickStartProps {
  onMethodSelect: (method: 'quick' | 'custom') => void;
}

export default function QuickStart({ onMethodSelect }: QuickStartProps) {
  const [selectedMethod, setSelectedMethod] = useState<'quick' | 'custom'>('quick');
  const router = useRouter();

  const handleContinue = () => {
    onMethodSelect(selectedMethod);
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4 px-4">
            How would you like to create your token?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Choose your preferred creation experience to get started
          </p>
        </div>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
          {/* Quick Mint Card */}
          <div
            className={`relative border-2 rounded-xl p-5 sm:p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'quick'
                ? 'border-red-500 bg-red-50/30 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedMethod('quick')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedMethod('quick');
              }
            }}
          >
            {/* Selection Indicator */}
            {selectedMethod === 'quick' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img
                  src="/images/quick-mint.svg"
                  className="w-14 h-14 sm:w-16 sm:h-16"
                  alt="Quick Mint Icon"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-black mb-1">
                  Quick Mint
                </h3>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                  Recommended
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
              Fast track token creation with sensible defaults. Perfect for getting started quickly without complex configuration.
            </p>

            {/* Features List */}
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Standard meme coin setup with proven defaults</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>1 billion token supply (6 decimals)</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>All tokens mint directly to your wallet</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Skip complex tokenomics configuration</span>
              </li>
            </ul>

            {/* Time Estimate */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Launch Time: 2-5 minutes</span>
              </div>
            </div>
          </div>

          {/* Custom Creation Card */}
          <div
            className={`relative border-2 rounded-xl p-5 sm:p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === 'custom'
                ? 'border-red-500 bg-red-50/30 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedMethod('custom')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedMethod('custom');
              }
            }}
          >
            {/* Selection Indicator */}
            {selectedMethod === 'custom' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <img
                  src="/images/custom-mint.svg"
                  className="w-12 h-12 sm:w-14 sm:h-14"
                  alt="Custom Creation Icon"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-black mb-1">
                  Custom Creation
                </h3>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                  Advanced
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
              Full control over every aspect of your token. Configure allocations, fees, vesting schedules, and advanced settings.
            </p>

            {/* Features List */}
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Complete tokenomics customization</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Token allocations and vesting schedules</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Bonding curve and fee configuration</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Advanced authority and security settings</span>
              </li>
            </ul>

            {/* Time Estimate */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Launch Time: 10-20 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEAR Promotion Banner */}
        <div className="px-4 mb-8">
          <div className="w-full border border-red-500 bg-[#DD3345] rounded-xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg">
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/40 p-1 flex-shrink-0">
                  <img
                    src="/images/thunder.png"
                    alt="NEAR Launch"
                    className="w-10 h-10 sm:w-12 sm:h-12"
                  />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-white mb-0.5">
                    Mint on NEAR
                  </p>
                  <p className="text-xs sm:text-sm text-gray-100">
                    Quickly mint, create, and list your tokens on NEAR blockchain
                  </p>
                </div>
              </div>
              <Link
                href="https://sale.potlaunch.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-row gap-1.5 items-center transition-all hover:gap-2"
              >
                <span className="text-white text-sm font-medium group-hover:underline whitespace-nowrap">
                  Get Started
                </span>
                <ChevronRight className="text-white h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"/>
              </Link>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200 mt-6"/>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 px-4">
          <button
            onClick={handleCancel}
            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
          >
            <span>Continue to Token Creation</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
