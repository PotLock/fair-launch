"use client"

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InfoTooltip, DBC_TOOLTIPS } from '@/components/ui/info-tooltip';

interface DBCConfigProps {
  onNext: (data: DBCConfigData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  initialData?: DBCConfigData;
}

export interface DBCConfigData {
  buildCurveMode: "0" | "1" | "2" | "3";
  // Mode 0 fields
  percentageSupplyOnMigration?: number;
  migrationQuoteThreshold?: number;
  // Mode 1, 2, 3 fields
  initialMarketCap?: number;
  migrationMarketCap?: number;
  // Mode 3 only
  liquidityWeights?: number[];
  // General fields
  migrationOption: "0" | "1";
  dynamicFeeEnabled: boolean;
  activationType: "0" | "1";
  collectFeeMode: "0" | "1";
  migrationFeeOption: "0" | "1" | "2" | "3" | "4" | "5" | "6";
  tokenType: "0" | "1";
  // Migrated Pool Fee (only for DAMM v2 + Customizable)
  migratedPoolFee?: {
    collectFeeMode: "0" | "1";
    dynamicFee: "0" | "1";
    poolFeeBps: number;
  };
}

const buildCurveModes = [
  { value: "0", label: "Build Curve", description: "Configure curve with specific migration threshold and supply" },
  { value: "1", label: "Market Cap Based", description: "Curve based on initial and migration market cap" },
  { value: "2", label: "Two Segments", description: "Dual constant product curve with 2 segments" },
  { value: "3", label: "Liquidity Weights", description: "Custom curve with liquidity weights" }
];

const migrationOptions = [
  { value: "0", label: "DAMM v1", description: "Migrate to DAMM v1 pool" },
  { value: "1", label: "DAMM v2", description: "Migrate to DAMM v2 pool (recommended)" }
];

const activationTypes = [
  { value: "0", label: "Slot (400ms)", description: "Measured in slots" },
  { value: "1", label: "Timestamp (seconds)", description: "Measured in seconds" }
];

const collectFeeModes = [
  { value: "0", label: "Quote Token", description: "Collect fees in quote token" },
  { value: "1", label: "Output Token", description: "Collect fees in output token" }
];

const migrationFeeOptions = [
  { value: "0", label: "LP Fee 0.25%", description: "0.25% LP fee" },
  { value: "1", label: "LP Fee 0.3%", description: "0.3% LP fee" },
  { value: "2", label: "LP Fee 1%", description: "1% LP fee" },
  { value: "3", label: "LP Fee 2%", description: "2% LP fee (recommended)" },
  { value: "4", label: "LP Fee 4%", description: "4% LP fee" },
  { value: "5", label: "LP Fee 6%", description: "6% LP fee" },
  { value: "6", label: "Customizable", description: "Custom (DAMM v2 only)" }
];

const tokenTypes = [
  { value: "0", label: "SPL Token", description: "Standard SPL token" },
  { value: "1", label: "Token 2022", description: "Token following Token-2022 standard" }
];

export default function DBCConfig({
  onNext,
  onBack,
  onCancel,
  currentStep = 2,
  totalSteps = 7,
  initialData
}: DBCConfigProps) {
  const [formData, setFormData] = useState<DBCConfigData>({
    buildCurveMode: initialData?.buildCurveMode || "0",
    percentageSupplyOnMigration: initialData?.percentageSupplyOnMigration || 20,
    migrationQuoteThreshold: initialData?.migrationQuoteThreshold || 100,
    initialMarketCap: initialData?.initialMarketCap,
    migrationMarketCap: initialData?.migrationMarketCap,
    liquidityWeights: initialData?.liquidityWeights || Array(16).fill(1),
    migrationOption: initialData?.migrationOption || "1",
    dynamicFeeEnabled: initialData?.dynamicFeeEnabled !== undefined ? initialData.dynamicFeeEnabled : true,
    activationType: initialData?.activationType || "1",
    collectFeeMode: initialData?.collectFeeMode || "0",
    migrationFeeOption: initialData?.migrationFeeOption || "3",
    tokenType: initialData?.tokenType || "0",
    migratedPoolFee: initialData?.migratedPoolFee || {
      collectFeeMode: "0",
      dynamicFee: "0",
      poolFeeBps: 100,
    },
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof DBCConfigData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLiquidityWeightChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 1;
    setFormData(prev => {
      const newWeights = [...(prev.liquidityWeights || Array(16).fill(1))];
      newWeights[index] = numValue;
      return { ...prev, liquidityWeights: newWeights };
    });
  };

  const handleMigratedPoolFeeChange = (field: 'collectFeeMode' | 'dynamicFee' | 'poolFeeBps', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      migratedPoolFee: {
        ...prev.migratedPoolFee!,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on buildCurveMode
    if (formData.buildCurveMode === "0") {
      if (!formData.percentageSupplyOnMigration || !formData.migrationQuoteThreshold) {
        toast.error('Please fill in percentageSupplyOnMigration and migrationQuoteThreshold');
        return;
      }
    } else if (["1", "2"].includes(formData.buildCurveMode)) {
      if (!formData.initialMarketCap || !formData.migrationMarketCap) {
        toast.error('Please fill in initialMarketCap and migrationMarketCap');
        return;
      }
      if (formData.buildCurveMode === "2" && !formData.percentageSupplyOnMigration) {
        toast.error('Please fill in percentageSupplyOnMigration');
        return;
      }
    } else if (formData.buildCurveMode === "3") {
      if (!formData.initialMarketCap || !formData.migrationMarketCap || !formData.liquidityWeights) {
        toast.error('Please fill in all required fields for Liquidity Weights mode');
        return;
      }
    }

    onNext(formData);
  };

  // Determine which fields to show based on buildCurveMode
  const showMode0Fields = formData.buildCurveMode === "0";
  const showMode1Fields = formData.buildCurveMode === "1";
  const showMode2Fields = formData.buildCurveMode === "2";
  const showMode3Fields = formData.buildCurveMode === "3";
  const showMarketCapFields = ["1", "2", "3"].includes(formData.buildCurveMode);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Bonding Curve Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Configure your bonding curve and migration settings for your token.
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
          {/* Build Curve Mode */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center">
              Curve Settings
              <InfoTooltip content={DBC_TOOLTIPS.buildCurveMode.title} />
            </h3>

            <div className="mb-3 sm:mb-4 w-full">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                Build Curve Mode <strong className="text-red-500">*</strong>
                <InfoTooltip content="Select the bonding curve type that suits your tokenomics strategy" />
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                  {buildCurveModes.find(mode => mode.value === formData.buildCurveMode)?.label || 'Select mode'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {buildCurveModes.map(mode => (
                    <DropdownMenuItem
                      key={mode.value}
                      onClick={() => handleInputChange('buildCurveMode', mode.value as "0" | "1" | "2" | "3")}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs text-gray-500">{mode.description}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mode Description Card */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-sm mb-2">
                {buildCurveModes.find(m => m.value === formData.buildCurveMode)?.label}
              </h4>
              <p className="text-xs text-gray-700">
                {DBC_TOOLTIPS.buildCurveMode.modes[formData.buildCurveMode as "0" | "1" | "2" | "3"].description}
              </p>
            </div>

            {/* Conditional Fields based on Build Curve Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Mode 0: Build Curve */}
              {showMode0Fields && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      Percentage Supply on Migration (%) <strong className="text-red-500">*</strong>
                      <InfoTooltip content={DBC_TOOLTIPS.percentageSupplyOnMigration} />
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={formData.percentageSupplyOnMigration || ''}
                      onChange={(e) => handleInputChange('percentageSupplyOnMigration', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      Migration Quote Threshold <strong className="text-red-500">*</strong>
                      <InfoTooltip content={DBC_TOOLTIPS.migrationQuoteThreshold} />
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.migrationQuoteThreshold || ''}
                      onChange={(e) => handleInputChange('migrationQuoteThreshold', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                      min="1"
                      required
                    />
                  </div>
                </>
              )}

              {/* Mode 1, 2, 3: Market Cap Fields */}
              {showMarketCapFields && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      Initial Market Cap <strong className="text-red-500">*</strong>
                      <InfoTooltip content={DBC_TOOLTIPS.initialMarketCap} />
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={formData.initialMarketCap || ''}
                      onChange={(e) => handleInputChange('initialMarketCap', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      Migration Market Cap <strong className="text-red-500">*</strong>
                      <InfoTooltip content={DBC_TOOLTIPS.migrationMarketCap} />
                    </label>
                    <input
                      type="number"
                      placeholder="600"
                      value={formData.migrationMarketCap || ''}
                      onChange={(e) => handleInputChange('migrationMarketCap', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </>
              )}

              {/* Mode 2: Additional percentage field */}
              {showMode2Fields && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Percentage Supply on Migration (%) <strong className="text-red-500">*</strong>
                    <InfoTooltip content={DBC_TOOLTIPS.percentageSupplyOnMigration} />
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    value={formData.percentageSupplyOnMigration || ''}
                    onChange={(e) => handleInputChange('percentageSupplyOnMigration', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              )}
            </div>

            {/* Mode 3: Liquidity Weights */}
            {showMode3Fields && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Liquidity Weights (16 segments) <strong className="text-red-500">*</strong>
                  <InfoTooltip content={DBC_TOOLTIPS.liquidityWeights} />
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(formData.liquidityWeights || Array(16).fill(1)).map((weight, index) => (
                    <input
                      key={index}
                      type="number"
                      placeholder={`W${index + 1}`}
                      value={weight}
                      onChange={(e) => handleLiquidityWeightChange(index, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      min="0"
                      step="0.1"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Each weight controls the liquidity thickness of the corresponding segment. Higher value = more liquidity.
                </p>
              </div>
            )}
          </div>

          {/* Migration Settings */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Migration Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Migration Option <strong className="text-red-500">*</strong>
                  <InfoTooltip content="Select DAMM version to migrate pool after graduation" />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                    {migrationOptions.find(option => option.value === formData.migrationOption)?.label || 'Select option'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {migrationOptions.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleInputChange('migrationOption', option.value as "0" | "1")}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-gray-500">{option.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Migration Fee Option <strong className="text-red-500">*</strong>
                  <InfoTooltip content={DBC_TOOLTIPS.migrationFeeOption.description} />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                    {migrationFeeOptions.find(option => option.value === formData.migrationFeeOption)?.label || 'Select fee option'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {migrationFeeOptions.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleInputChange('migrationFeeOption', option.value as "0" | "1" | "2" | "3" | "4" | "5" | "6")}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-gray-500">{option.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Migrated Pool Fee (Conditional) */}
          {formData.migrationOption === "1" && formData.migrationFeeOption === "6" && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 flex items-center">
                Migrated Pool Fee Configuration
                <InfoTooltip content={DBC_TOOLTIPS.migratedPoolFee.description} />
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  This section is only available when using <strong>DAMM v2</strong> with <strong>Customizable</strong> fee option.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Collect Fee Mode <strong className="text-red-500">*</strong>
                    <InfoTooltip content={DBC_TOOLTIPS.migratedPoolFee.collectFeeMode} />
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                      {formData.migratedPoolFee?.collectFeeMode === "0" ? "Quote Token" : "Output Token"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleMigratedPoolFeeChange('collectFeeMode', "0")}
                        className="cursor-pointer"
                      >
                        Quote Token
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleMigratedPoolFeeChange('collectFeeMode', "1")}
                        className="cursor-pointer"
                      >
                        Output Token
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Dynamic Fee <strong className="text-red-500">*</strong>
                    <InfoTooltip content={DBC_TOOLTIPS.migratedPoolFee.dynamicFee} />
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                      {formData.migratedPoolFee?.dynamicFee === "0" ? "Disabled" : "Enabled"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleMigratedPoolFeeChange('dynamicFee', "0")}
                        className="cursor-pointer"
                      >
                        Disabled
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleMigratedPoolFeeChange('dynamicFee', "1")}
                        className="cursor-pointer"
                      >
                        Enabled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Pool Fee (BPS) <strong className="text-red-500">*</strong>
                    <InfoTooltip content={DBC_TOOLTIPS.migratedPoolFee.poolFeeBps} />
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.migratedPoolFee?.poolFeeBps || 100}
                    onChange={(e) => handleMigratedPoolFeeChange('poolFeeBps', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="10"
                    max="1000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 10 bps (0.1%), Maximum 1000 bps (10%)</p>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Advanced Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Activation Type <strong className="text-red-500">*</strong>
                  <InfoTooltip content="Select time unit for pool timing calculations" />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                    {activationTypes.find(type => type.value === formData.activationType)?.label || 'Select type'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {activationTypes.map(type => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => handleInputChange('activationType', type.value as "0" | "1")}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Collect Fee Mode <strong className="text-red-500">*</strong>
                  <InfoTooltip content="Select token type for pre-graduation fee collection" />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                    {collectFeeModes.find(mode => mode.value === formData.collectFeeMode)?.label || 'Select mode'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {collectFeeModes.map(mode => (
                      <DropdownMenuItem
                        key={mode.value}
                        onClick={() => handleInputChange('collectFeeMode', mode.value as "0" | "1")}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{mode.label}</span>
                          <span className="text-xs text-gray-500">{mode.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Token Type <strong className="text-red-500">*</strong>
                  <InfoTooltip content="Select token standard for deployment" />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer bg-white">
                    {tokenTypes.find(type => type.value === formData.tokenType)?.label || 'Select type'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {tokenTypes.map(type => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => handleInputChange('tokenType', type.value as "0" | "1")}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className='mt-8 ml-1'>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dynamicFeeEnabled}
                    onChange={(e) => handleInputChange('dynamicFeeEnabled', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Enable Dynamic Fee
                    <InfoTooltip content={DBC_TOOLTIPS.dynamicFeeEnabled} />
                  </span>
                </label>
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
            className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg transition-colors hover:bg-red-600 flex items-center justify-center cursor-pointer"
          >
            Continue to Fee Config
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
