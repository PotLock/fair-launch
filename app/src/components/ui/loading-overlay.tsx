"use client"

import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export default function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  subMessage 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent absolute top-0 left-0"></div>
          </div>
          
          {/* Loading message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-gray-600">
                {subMessage}
              </p>
            )}
          </div>
          
          {/* Progress dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
