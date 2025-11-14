"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { toast } from "sonner";
import { Progress } from '@/components/ui/progress';
import { uploadImage } from '@/lib/api';
import URLInput from '@/components/ui/url-input';
import { TagsSelectModal, TAG_ICONS } from '@/components/modal/TagsSelectModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const TOKEN_QUOTE_OPTIONS = {
  usdc: {
    label: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    icon: '/tokens/usdc.svg'
  },
  usdt: {
    label: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    icon: '/tokens/usdt.png'
  },
  wsol: {
    label: 'SOL',
    address: 'So11111111111111111111111111111111111111112',
    icon: '/chains/solana-dark.svg'
  },
  custom: {
    label: 'Custom Token',
    address: '',
  },
};

interface TokenInfoProps {
  onNext: (data: TokenInfoData) => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: TokenInfoData;
}

export interface TokenInfoData {
  name: string;
  symbol: string;
  description?: string;
  logo?: string;
  banner?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  totalTokenSupply: number;
  tokenBaseDecimal: number;
  tokenQuoteDecimal: number;
  tokenQuoteAddress?: string;
  tokenQuoteType?: 'usdc' | 'usdt' | 'wsol' | 'custom';
  tags?: string[];
}

export default function TokenInfo({
  onNext,
  onCancel,
  currentStep = 1,
  totalSteps = 7,
  initialData
}: TokenInfoProps) {
  const [formData, setFormData] = useState<TokenInfoData>({
    name: initialData?.name || '',
    symbol: initialData?.symbol || '',
    description: initialData?.description || '',
    logo: initialData?.logo || '',
    banner: initialData?.banner || '',
    website: initialData?.website || '',
    twitter: initialData?.twitter || '',
    telegram: initialData?.telegram || '',
    totalTokenSupply: initialData?.totalTokenSupply || 1000000000,
    tokenBaseDecimal: initialData?.tokenBaseDecimal || 6,
    tokenQuoteDecimal: initialData?.tokenQuoteDecimal || 9,
    tokenQuoteAddress: initialData?.tokenQuoteAddress || TOKEN_QUOTE_OPTIONS.wsol.address,
    tokenQuoteType: initialData?.tokenQuoteType || 'wsol',
    tags: initialData?.tags || [],
  });

  const [dragOver, setDragOver] = useState<'logo' | 'banner' | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  const progressPercentage = useMemo(() =>
    (currentStep / totalSteps) * 100,
    [currentStep, totalSteps]
  );

  const handleInputChange = useCallback((field: keyof TokenInfoData, value: string) => {
    let next: string | number = value;
    // Limit token symbol to max 5 characters
    if (field === 'symbol') {
      next = value.slice(0, 5);
    }
    // Enforce numeric-only for total token supply (positive integer)
    if (field === 'totalTokenSupply') {
      const digits = value.replace(/[^\d]/g, '');
      next = digits ? Number(digits) : 0;
    }
    // Enforce numeric-only for decimals and max 2 digits (0-99)
    if (field === 'tokenBaseDecimal' || field === 'tokenQuoteDecimal') {
      const digits = value.replace(/[^\d]/g, '').slice(0, 2);
      let num = digits ? Number(digits) : 0;
      if (num > 99) num = 99;
      next = num;
    }
    // Allow free editing for social fields
    if (field === 'twitter') {
      next = value;
    }

    if (field === 'telegram') {
      next = value;
    }

    if (field === 'website') {
      next = value;
    }

    setFormData(prev => ({ ...prev, [field]: next as any }));
  }, []);

  const handleQuoteTypeChange = useCallback((type: 'usdc' | 'usdt' | 'wsol' | 'custom') => {
    const address = type === 'custom' ? '' : TOKEN_QUOTE_OPTIONS[type].address;
    setFormData(prev => ({
      ...prev,
      tokenQuoteType: type,
      tokenQuoteAddress: address
    }));
  }, []);

  const handleImageUpload = useCallback(async (type: 'logo' | 'banner', file: File) => {
    if (!file) {
      console.error('No file provided for upload');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      if (type === 'logo') {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingBanner(true);
      }

      // Upload the image using our API
      const fileName = `${type}-${Date.now()}-${file.name}`;
      const result = await uploadImage(file, fileName);

      if (result.success && result.data?.imageUri) {
        const imageUrl = result.data.imageUri;

        if (type === 'logo') {
          setFormData(prev => ({ ...prev, logo: imageUrl }));
          toast.success('Logo uploaded successfully!');
        } else {
          setFormData(prev => ({ ...prev, banner: imageUrl }));
          toast.success('Banner uploaded successfully!');
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}. Please try again.`);
    } finally {
      if (type === 'logo') {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, field: 'logo' | 'banner') => {
    e.preventDefault();
    setDragOver(field);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, field: 'logo' | 'banner') => {
    e.preventDefault();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(field, files[0]);
    }
  }, [handleImageUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(field, files[0]);
    }
  }, [handleImageUpload]);

  const sanitizeUrl = useCallback((value: string | undefined, type: 'twitter' | 'telegram' | 'website'): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();

    if (type === 'twitter') {
      // Extract username from various formats
      const raw = trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^(x\.com|twitter\.com)\//, '');
      const username = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 15);
      return username ? `https://x.com/${username}` : undefined;
    }

    if (type === 'telegram') {
      // Extract handle from various formats
      const raw = trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^(t\.me|telegram\.me|telegram\.org)\//, '');
      const handle = raw.replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
      return handle.length >= 5 ? `https://t.me/${handle}` : undefined;
    }

    if (type === 'website') {
      // Ensure valid URL format
      if (!trimmed) return undefined;
      const withoutProto = trimmed.replace(/^https?:\/\//, '');
      if (!withoutProto) return undefined;
      try {
        const url = new URL(`https://${withoutProto}`);
        return url.toString();
      } catch {
        return undefined;
      }
    }

    return trimmed;
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Token name is required');
      return;
    }
    if (!formData.symbol.trim()) {
      toast.error('Token symbol is required');
      return;
    }
    if (!formData.logo) {
      toast.error('Token logo is required');
      return;
    }
    if (!formData.banner) {
      toast.error('Token banner is required');
      return;
    }
    if (formData.totalTokenSupply <= 0) {
      toast.error('Token supply must be greater than 0');
      return;
    }

    // Sanitize social URLs before passing to next step
    const sanitizedData = {
      ...formData,
      website: sanitizeUrl(formData.website, 'website'),
      twitter: sanitizeUrl(formData.twitter, 'twitter'),
      telegram: sanitizeUrl(formData.telegram, 'telegram'),
    };

    onNext(sanitizedData);
  }, [formData, onNext, sanitizeUrl]);

  const isFormValid = useMemo(() =>
    formData.name.trim() !== '' &&
    formData.symbol.trim() !== '' &&
    formData.totalTokenSupply > 0 &&
    formData.logo !== '' &&
    formData.banner !== '',
    [formData.name, formData.symbol, formData.totalTokenSupply, formData.logo, formData.banner]
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
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
      <div className="px-4 mb-8 max-w-4xl w-full">
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
          {/* Token Information */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Name <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="text"
                  placeholder="e.g, Dogecoin"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Symbol <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="text"
                  placeholder="Token Symbol"
                  value={formData.symbol.toUpperCase()}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your token's purpose
              </label>
              <textarea
                placeholder="Describe your token's purpose"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base resize-none"
              />
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 min-h-[48px] p-3 border border-gray-300 rounded-lg bg-neutral-50">
                {formData.tags && formData.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg border border-gray-200 transition-shadow"
                      >
                        <span className="text-base">{TAG_ICONS[tag] || "📦"}</span>
                        <span className="capitalize">{tag}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            tags: prev.tags?.filter(t => t !== tag) || [] 
                          }))}
                          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    No tags selected
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsTagsModalOpen(true)}
                className="mt-2 px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                {formData.tags && formData.tags.length > 0 ? "Edit Tags" : "Add Tags"}
              </button>
            </div>
          </div>

          {/* Token Branding */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Token Branding <strong className="text-red-500">*</strong></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Logo Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('logo-upload')?.click()}
                onDrop={(e) => handleDrop(e, 'logo')}
                onDragOver={(e) => handleDragOver(e, 'logo')}
                onDragLeave={handleDragLeave}
              >
                {formData.logo ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_IPFS_URL}${formData.logo}`} 
                      alt="Token Logo" 
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    {isUploadingLogo && (
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center mb-2">
                      {isUploadingLogo ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      ) : (
                        <img src="/icons/add-image.svg" alt="Add Image" />
                      )}
                    </div>
                    <h4 className="text-gray-700 mb-1 font-medium text-sm">
                      Token Logo <strong className="text-red-500">*</strong>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
                    <p className="text-xs text-gray-400 mt-1">Recommended: 512x512px</p>
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

              {/* Banner Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => document.getElementById('banner-upload')?.click()}
                onDrop={(e) => handleDrop(e, 'banner')}
                onDragOver={(e) => handleDragOver(e, 'banner')}
                onDragLeave={handleDragLeave}
              >
                {formData.banner ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_IPFS_URL}${formData.banner}`} 
                      alt="Banner Image" 
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    {isUploadingBanner && (
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center mb-2">
                      {isUploadingBanner ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      ) : (
                        <img src="/icons/add-image.svg" alt="Add Image" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-700 mb-1 text-sm">
                      Banner image <strong className="text-red-500">*</strong>
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">Drop your image here or browse</p>
                    <p className="text-xs text-gray-400 mt-1">Recommended: 1500x500px</p>
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

          {/* Social Links */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-black">Add Socials</h3>
            </div>
            <div className="flex flex-col md:flex-row justify-between gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <URLInput
                  prefix="https://"
                  value={formData.website || ""}
                  onChange={(value) => handleInputChange('website', value)}
                  placeholder="yourwebsite.com"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X/Twitter
                </label>
                <URLInput
                  prefix="x.com/"
                  value={formData.twitter || ""}
                  onChange={(value) => handleInputChange('twitter', value)}
                  placeholder="yourusername"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram
                </label>
                <URLInput
                  prefix="t.me/"
                  value={formData.telegram || ""}
                  onChange={(value) => handleInputChange('telegram', value)}
                  placeholder="yourchannel"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Tokenomics */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Tokenomics</h3>
            <div className='flex flex-row gap-2 justify-between'>
              <div className="space-y-2 mb-3 sm:mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Token Supply <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={formData.totalTokenSupply}
                  onChange={(e) => handleInputChange('totalTokenSupply', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="space-y-2 mb-3 sm:mb-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Quote Address
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base bg-white flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {formData.tokenQuoteType !== 'custom' && TOKEN_QUOTE_OPTIONS[formData.tokenQuoteType || 'usdc'].icon && (
                          <img
                            src={TOKEN_QUOTE_OPTIONS[formData.tokenQuoteType || 'usdc'].icon}
                            alt={TOKEN_QUOTE_OPTIONS[formData.tokenQuoteType || 'usdc'].label}
                            className="w-5 h-5 shrink-0"
                          />
                        )}
                        <span className="truncate">
                          {formData.tokenQuoteType === 'custom'
                            ? TOKEN_QUOTE_OPTIONS.custom.label
                            : `${TOKEN_QUOTE_OPTIONS[formData.tokenQuoteType || 'usdc'].label}`
                          }
                        </span>
                      </div>
                      <svg className="w-4 h-4 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => handleQuoteTypeChange('usdc')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={TOKEN_QUOTE_OPTIONS.usdc.icon}
                          alt={TOKEN_QUOTE_OPTIONS.usdc.label}
                          className="w-5 h-5 shrink-0"
                        />
                        <span className="font-medium">{TOKEN_QUOTE_OPTIONS.usdc.label}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuoteTypeChange('usdt')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={TOKEN_QUOTE_OPTIONS.usdt.icon}
                          alt={TOKEN_QUOTE_OPTIONS.usdt.label}
                          className="w-5 h-5 shrink-0"
                        />
                        <span className="font-medium">{TOKEN_QUOTE_OPTIONS.usdt.label}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuoteTypeChange('wsol')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={TOKEN_QUOTE_OPTIONS.wsol.icon}
                          alt={TOKEN_QUOTE_OPTIONS.wsol.label}
                          className="w-5 h-5 shrink-0"
                        />
                        <span className="font-medium">{TOKEN_QUOTE_OPTIONS.wsol.label}</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuoteTypeChange('custom')}
                      className="cursor-pointer"
                    >
                      <span className="font-medium">{TOKEN_QUOTE_OPTIONS.custom.label}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {formData.tokenQuoteType === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom token quote address"
                    value={formData.tokenQuoteAddress}
                    onChange={(e) => handleInputChange('tokenQuoteAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base mt-2"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Base Decimal
                </label>
              <input
                type="number"
                placeholder="6"
                value={formData.tokenBaseDecimal}
                onChange={(e) => handleInputChange('tokenBaseDecimal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                min="0"
                max="99"
                step="1"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Quote Decimal
                </label>
              <input
                type="number"
                placeholder="6"
                value={formData.tokenQuoteDecimal}
                onChange={(e) => handleInputChange('tokenQuoteDecimal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                min="0"
                max="99"
                step="1"
              />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 max-w-4xl mx-auto px-4">
          <button 
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg transition-colors hover:bg-gray-50"
          >
            Cancel
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
            Continue to Curve Config
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>

      <TagsSelectModal
        open={isTagsModalOpen}
        onOpenChange={setIsTagsModalOpen}
        value={formData.tags || []}
        onConfirm={(tags) => setFormData(prev => ({ ...prev, tags }))}
      />
    </div>
  );
}
