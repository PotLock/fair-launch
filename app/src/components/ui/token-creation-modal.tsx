"use client"

import React, { useState, useEffect } from 'react';
import { getIpfsUrl } from "@/lib/utils";

interface TokenCreationModalProps {
  isVisible: boolean;
  stepMessage: string;
  subMessage?: string;
  progress: number;
  tokenLogo?: string;
  startTime?: number;
}


export default function TokenCreationModal({
  isVisible,
  stepMessage,
  subMessage,
  progress,
  tokenLogo,
  startTime
}: TokenCreationModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible || !startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-[360px] w-full shadow-2xl">
        <div className="text-center">
          {/* Token Logo */}
          {tokenLogo && (
            <div className="flex justify-center mb-4">
              <img
                src={getIpfsUrl(tokenLogo)}
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

          {/* Elapsed Time */}
          {startTime && elapsedTime > 0 && (
            <p className="text-sm text-blue-600 font-medium mb-2">
              Elapsed: {formatTime(elapsedTime)}
            </p>
          )}

          {/* Warning Message */}
          <p className="text-sm text-gray-500">
            Please don't close this window during deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
