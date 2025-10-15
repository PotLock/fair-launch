"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface DBCConfigProps {
  onNext: (data: DBCConfigData) => void;
  onBack: () => void;
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
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
  totalSteps = 7 
}: DBCConfigProps) {
  const [formData, setFormData] = useState<DBCConfigData>({
    buildCurveMode: "0",
    percentageSupplyOnMigration: 50,
    migrationQuoteThreshold: 1000,
    migrationOption: "0",
    dynamicFeeEnabled: false,
    activationType: "0",
    collectFeeMode: "0",
    migrationFeeOption: "0",
    tokenType: "0",
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
    <div className="min-h-screen bg-white flex flex-col">
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
          {/* Curve Configuration */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Curve Settings</h3>
            
            <div className="space-y-2">
              <label className="text-black font-medium">
                Build Curve Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.buildCurveMode}
                onChange={(e) => handleInputChange('buildCurveMode', e.target.value as "0" | "1" | "2" | "3")}
                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {buildCurveModes.map(mode => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Percentage Supply on Migration
                </label>
                <Input
                  type="number"
                  placeholder="50"
                  value={formData.percentageSupplyOnMigration}
                  onChange={(e) => handleInputChange('percentageSupplyOnMigration', e.target.value)}
                  className="h-12"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-600">Percentage of supply available at migration (0-100%)</p>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">
                  Migration Quote Threshold
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.migrationQuoteThreshold}
                  onChange={(e) => handleInputChange('migrationQuoteThreshold', e.target.value)}
                  className="h-12"
                  min="1"
                />
                <p className="text-sm text-gray-600">Minimum quote amount for migration</p>
              </div>
            </div>
          </div>

          {/* Migration Settings */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Migration Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">Migration Option</label>
                <select
                  value={formData.migrationOption}
                  onChange={(e) => handleInputChange('migrationOption', e.target.value as "0" | "1")}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {migrationOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">Migration Fee Option</label>
                <select
                  value={formData.migrationFeeOption}
                  onChange={(e) => handleInputChange('migrationFeeOption', e.target.value as "0" | "1" | "2" | "3" | "4" | "5")}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {migrationFeeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-black">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">Activation Type</label>
                <select
                  value={formData.activationType}
                  onChange={(e) => handleInputChange('activationType', e.target.value as "0" | "1")}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {activationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-black font-medium">Collect Fee Mode</label>
                <select
                  value={formData.collectFeeMode}
                  onChange={(e) => handleInputChange('collectFeeMode', e.target.value as "0" | "1")}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {collectFeeModes.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-black font-medium">Token Type</label>
                <select
                  value={formData.tokenType}
                  onChange={(e) => handleInputChange('tokenType', e.target.value as "0" | "1")}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {tokenTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dynamicFeeEnabled}
                    onChange={(e) => handleInputChange('dynamicFeeEnabled', e.target.checked)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-black font-medium">Enable Dynamic Fee</span>
                </label>
                <p className="text-sm text-gray-600">Allow fees to change based on market conditions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-8 py-3"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-8 py-3"
            >
              Cancel
            </Button>
          </div>
          <Button
            type="submit"
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            Continue to Fee Config
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}
