"use client"

import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

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
  percentageSupplyOnMigration: number;
  migrationQuoteThreshold: number;
  migrationOption: "0" | "1";
  dynamicFeeEnabled: boolean;
  activationType: "0" | "1";
  collectFeeMode: "0" | "1";
  migrationFeeOption: "0" | "1" | "2" | "3" | "4" | "5";
  tokenType: "0" | "1";
}

const buildCurveModes = [
  { value: "0", label: "Linear" },
  { value: "1", label: "Exponential" },
  { value: "2", label: "Logarithmic" },
  { value: "3", label: "Custom" }
];

const migrationOptions = [
  { value: "0", label: "Automatic" },
  { value: "1", label: "Manual" }
];

const activationTypes = [
  { value: "0", label: "Immediate" },
  { value: "1", label: "Delayed" }
];

const collectFeeModes = [
  { value: "0", label: "Continuous" },
  { value: "1", label: "Batch" }
];

const migrationFeeOptions = [
  { value: "0", label: "No Fee" },
  { value: "1", label: "Fixed Fee" },
  { value: "2", label: "Percentage Fee" },
  { value: "3", label: "Tiered Fee" },
  { value: "4", label: "Dynamic Fee" },
  { value: "5", label: "Custom Fee" }
];

const tokenTypes = [
  { value: "0", label: "Standard" },
  { value: "1", label: "Governance" }
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
    migrationOption: initialData?.migrationOption || "1",
    dynamicFeeEnabled: initialData?.dynamicFeeEnabled || true,
    activationType: initialData?.activationType || "1",
    collectFeeMode: initialData?.collectFeeMode || "0",
    migrationFeeOption: initialData?.migrationFeeOption || "3",
    tokenType: initialData?.tokenType || "0",
  });

  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof DBCConfigData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">
          Bonding Curve Configuration
        </h1>
        <p className="text-gray-600 text-lg">
          Configure your token's bonding curve and migration settings.
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
          {/* Curve Configuration */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Curve Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="mb-3 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Build Curve Mode <strong className="text-red-500">*</strong>
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
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
                      >
                        {mode.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage Supply on Migration
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.percentageSupplyOnMigration}
                    onChange={(e) => handleInputChange('percentageSupplyOnMigration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Migration Quote Threshold
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.migrationQuoteThreshold}
                    onChange={(e) => handleInputChange('migrationQuoteThreshold', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                    min="1"
                  />
                </div>
            </div>
          </div>

          {/* Migration Settings */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Migration Settings</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Migration Option
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
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
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Migration Fee Option
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
                    {migrationFeeOptions.find(option => option.value === formData.migrationFeeOption)?.label || 'Select fee option'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {migrationFeeOptions.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleInputChange('migrationFeeOption', option.value as "0" | "1" | "2" | "3" | "4" | "5")}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activation Type
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
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
                      >
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collect Fee Mode
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
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
                      >
                        {mode.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Type
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-left flex justify-between items-center cursor-pointer">
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
                      >
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='mt-10 ml-1'>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dynamicFeeEnabled}
                    onChange={(e) => handleInputChange('dynamicFeeEnabled', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Dynamic Fee</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg transition-colors hover:bg-red-600 flex items-center justify-center"
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
