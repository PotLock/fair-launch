import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Progress } from '../../ui/progress';
import { cn } from '../../../lib/utils';

interface TokenInfoProps {
  onNext: (data: TokenInfoData) => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
}

export interface TokenInfoData {
  name: string;
  symbol: string;
  description: string;
  logo?: string;
  banner?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  totalTokenSupply: number;
  tokenBaseDecimal: number;
  tokenQuoteDecimal: number;
}

export default function TokenInfo({ 
  onNext, 
  onCancel, 
  currentStep = 1, 
  totalSteps = 7 
}: TokenInfoProps) {
  const [formData, setFormData] = useState<TokenInfoData>({
    name: '',
    symbol: '',
    description: '',
    logo: '',
    banner: '',
    website: '',
    twitter: '',
    telegram: '',
    totalTokenSupply: 1000000,
    tokenBaseDecimal: 6,
    tokenQuoteDecimal: 6,
  });

  const [dragOver, setDragOver] = useState<'logo' | 'banner' | null>(null);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof TokenInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: 'logo' | 'banner', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, field: 'logo' | 'banner') => {
    e.preventDefault();
    setDragOver(field);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, field: 'logo' | 'banner') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(field, files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(field, files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.symbol) {
      onNext(formData);
    }
  };

  const isFormValid = formData.name.trim() !== '' && formData.symbol.trim() !== '' && formData.totalTokenSupply > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          What's your token called?
        </h1>
        <p className="text-gray-600 text-lg">
          Add your token name, symbol, logo, and social links.
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
          {/* Token Information */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Token Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g, Dogecoin"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Token Symbol
                </label>
                <Input
                  placeholder="Token Symbol"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-black font-medium">
                Describe your token's purpose
              </label>
              <textarea
                placeholder="Describe what your token is for..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Token Branding */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-black">Token Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token Logo Upload */}
              <div className="space-y-2">
                <label className="text-black font-medium">Token Logo</label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    dragOver === 'logo' ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
                    formData.logo && "border-green-500 bg-green-50"
                  )}
                  onDragOver={(e) => handleDragOver(e, 'logo')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'logo')}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {formData.logo ? (
                    <div className="space-y-2">
                      <img 
                        src={formData.logo} 
                        alt="Token Logo" 
                        className="w-16 h-16 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-600">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto text-gray-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                      <p className="text-black font-medium">Token Logo</p>
                      <p className="text-sm text-gray-600">Drop your image here or browse</p>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, 'logo')}
                  />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div className="space-y-2">
                <label className="text-black font-medium">Banner image</label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    dragOver === 'banner' ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400",
                    formData.banner && "border-green-500 bg-green-50"
                  )}
                  onDragOver={(e) => handleDragOver(e, 'banner')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'banner')}
                  onClick={() => document.getElementById('banner-upload')?.click()}
                >
                  {formData.banner ? (
                    <div className="space-y-2">
                      <img 
                        src={formData.banner} 
                        alt="Banner Image" 
                        className="w-16 h-16 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-600">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto text-gray-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                      <p className="text-black font-medium">Banner image</p>
                      <p className="text-sm text-gray-600">Drop your image here or browse</p>
                    </div>
                  )}
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, 'banner')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-black">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">Website</label>
                <Input
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">Twitter</label>
                <Input
                  placeholder="https://twitter.com/username"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">Telegram</label>
                <Input
                  placeholder="https://t.me/username"
                  value={formData.telegram}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Tokenomics */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-black">Tokenomics</h3>
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-8 py-3"
          >
            Cancel
          </Button>
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
