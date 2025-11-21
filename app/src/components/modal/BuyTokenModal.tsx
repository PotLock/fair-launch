"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, getIpfsUrl } from "@/lib/utils";

interface BuyTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  tokenLogo?: string;
  onConfirm: (amount: string) => void;
  onSkip: () => void;
}

export function BuyTokenModal({
  open,
  onOpenChange,
  tokenSymbol,
  tokenLogo,
  onConfirm,
  onSkip,
}: BuyTokenModalProps) {
  const [amount, setAmount] = useState<string>("0.1");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  // Preset amounts in SOL
  const presetAmounts = ["0.1", "0.5", "1.0", "2.0"];

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setAmount("0.1");
      setCustomAmount("");
      setIsCustom(false);
    }
  }, [open]);

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, '');

    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    const formatted = parts.length > 2
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : sanitized;

    setCustomAmount(formatted);
    setAmount(formatted);
    setIsCustom(true);
  };

  const handleConfirm = () => {
    const finalAmount = isCustom ? customAmount : amount;
    const numAmount = parseFloat(finalAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    onConfirm(finalAmount);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  const getFinalAmount = () => {
    const finalAmount = isCustom ? customAmount : amount;
    const numAmount = parseFloat(finalAmount);
    return isNaN(numAmount) || numAmount <= 0 ? 0 : numAmount;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-none">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            {tokenLogo && (
              <img
                src={getIpfsUrl(tokenLogo)}
                alt={tokenSymbol}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <DialogTitle className="text-2xl font-bold text-gray-900 flex gap-1">
              Buy <p className="uppercase">{tokenSymbol}</p>
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-600 mt-2">
            Choose how many <strong className="uppercase">{tokenSymbol}</strong> you want to buy (optional)
          </DialogDescription>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Tip: Protect your token from snipers
              </p>
              <p className="text-xs text-blue-700">
                It's optional but buying a small amount of coins helps protect your coin from snipers
              </p>
            </div>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Amount (SOL)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAmountSelect(preset)}
                  className={cn(
                    "px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm cursor-pointer hover:shadow-sm",
                    amount === preset && !isCustom
                      ? "bg-red-50 border-red-500 text-red-600"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {preset} SOL
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter custom amount
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 pr-14 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all",
                  isCustom && customAmount
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                SOL
              </span>
            </div>
          </div>

          {/* Amount Summary */}
          {getFinalAmount() > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">You will spend:</span>
                <span className="text-lg font-bold text-gray-900">
                  {getFinalAmount().toFixed(4)} SOL
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Plus network fees (~0.001 SOL)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={getFinalAmount() <= 0}
            className={cn(
              "w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm",
              getFinalAmount() > 0
                ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            Buy & Deploy Token
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
