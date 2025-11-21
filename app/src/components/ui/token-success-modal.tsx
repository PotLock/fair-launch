"use client"

import Link from 'next/link';
import React from 'react';
import { getIpfsUrl } from "@/lib/utils";

interface TokenSuccessModalProps {
  isVisible: boolean;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  mintAddress?: string;
  onClose: () => void;
  onViewToken: () => void;
}

export default function TokenSuccessModal({ 
  isVisible, 
  tokenName, 
  tokenSymbol, 
  tokenLogo,
  mintAddress,
  onClose,
  onViewToken 
}: TokenSuccessModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          {/* Token Logo */}
          {tokenLogo && (
            <div className="flex justify-center mb-4">
              <img
                src={getIpfsUrl(tokenLogo)}
                alt="Token Logo"
                className="h-14 w-14 rounded-full object-cover"
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
                {tokenSymbol.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Success Message */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Token Created Successfully! 🎉
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your token <strong>"{tokenName}"</strong> ({tokenSymbol.toUpperCase()}) has been deployed to Solana blockchain.
          </p>

          {/* Token Details */}
          {mintAddress && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Token Address:</p>
              <Link href={`https://solscan.io/token/${mintAddress}?cluster=devnet`} target='_blank'>
                <p className="text-xs font-mono text-gray-700 break-all underline">
                  {mintAddress}
                </p>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button 
              onClick={onViewToken}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              View Token
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
