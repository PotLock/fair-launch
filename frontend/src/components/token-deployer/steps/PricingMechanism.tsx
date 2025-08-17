import { ChevronDown, ChevronUp, ArrowRight, CircleCheck, Lightbulb } from "lucide-react";
import { templatesPricingMechanism } from "../../../lib/pricingMechanism";
import { PricingTemplate } from "../../../types";
import { Input } from "../../ui/input";
import { useDeployStore } from "../../../stores/deployStores";
import type { StepProps } from '../../../types';

export const PricingMechanism = ({ isExpanded, stepKey, onHeaderClick }: StepProps) => {
    const { 
        pricingMechanism, 
        updatePricingMechanism, 
        validatePricingMechanism,
        validationErrors
    } = useDeployStore();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePricingMechanism({ [e.target.name]: e.target.value });
        validatePricingMechanism();
    };

    const handleSelectTemplate = (template: PricingTemplate) => {
        updatePricingMechanism({ curveType: template.value });
        validatePricingMechanism();
    };

    const handleBackToTemplates = () => {
        updatePricingMechanism({ 
            curveType: '',
            initialPrice: '',
            finalPrice: '',
            targetRaise: '',
            reserveRatio: ''
        });
        validatePricingMechanism();
    };

    // Recommendation logic
    const getRecommendations = () => {
        const recommendations: { [key: string]: string } = {};

        // Initial Price recommendation
        if (!pricingMechanism.initialPrice || pricingMechanism.initialPrice === '') {
            recommendations.initialPrice = 'Recommended: 0.0000001 SOL for fair entry';
        } else {
            const initialPrice = parseFloat(pricingMechanism.initialPrice);
            if (initialPrice < 0.0000001) {
                recommendations.initialPrice = 'Recommended: 0.0000001 SOL for fair entry';
            } else if (initialPrice > 0.01) {
                recommendations.initialPrice = 'High initial price may discourage early investors';
            }
        }

        // Final Price recommendation
        if (!pricingMechanism.finalPrice || pricingMechanism.finalPrice === '') {
            recommendations.finalPrice = 'Recommended: 10 SOL for significant growth potential';
        } else {
            const finalPrice = parseFloat(pricingMechanism.finalPrice);
            const initialPrice = parseFloat(pricingMechanism.initialPrice || '0');
            if (finalPrice <= initialPrice) {
                recommendations.finalPrice = 'Recommended: 10 SOL for significant growth potential';
            } else if (finalPrice > 100) {
                recommendations.finalPrice = 'Very high final price may be unrealistic';
            }
        }

        // Target Raise recommendation
        if (!pricingMechanism.targetRaise || pricingMechanism.targetRaise === '') {
            recommendations.targetRaise = 'Recommended: 10 SOL for balanced fundraising';
        } else {
            const targetRaise = parseFloat(pricingMechanism.targetRaise);
            if (targetRaise < 10) {
                recommendations.targetRaise = 'Recommended: 10 SOL for balanced fundraising';
            } else if (targetRaise > 1000) {
                recommendations.targetRaise = 'High target may be difficult to achieve';
            }
        }

        // Reserve Ratio recommendation
        if (!pricingMechanism.reserveRatio || pricingMechanism.reserveRatio === '') {
            recommendations.reserveRatio = 'Recommended: 20% for optimal liquidity and growth';
        } else {
            const reserveRatio = parseFloat(pricingMechanism.reserveRatio);
            if (reserveRatio < 10) {
                recommendations.reserveRatio = 'Low reserve ratio may cause price volatility';
            } else if (reserveRatio > 50) {
                recommendations.reserveRatio = 'High reserve ratio may limit price growth';
            }
        }

        return recommendations;
    };

    const recommendations = getRecommendations();

    // Check if all required fields are valid
    const isFormValid = () => {
        const hasErrors = Object.keys(validationErrors).some(key => 
            key.includes('curveType') || 
            key.includes('initialPrice') || 
            key.includes('finalPrice') || 
            key.includes('targetRaise') ||
            key.includes('reserveRatio')
        );
        
        const hasRequiredFields = pricingMechanism.curveType && 
                                 pricingMechanism.initialPrice && 
                                 pricingMechanism.finalPrice && 
                                 pricingMechanism.targetRaise && 
                                 pricingMechanism.reserveRatio;
        
        const hasValidValues = parseFloat(pricingMechanism.initialPrice) > 0 && 
                              parseFloat(pricingMechanism.finalPrice) > 0 && 
                              parseFloat(pricingMechanism.targetRaise) > 0 && 
                              parseFloat(pricingMechanism.reserveRatio) > 0;
        
        return !hasErrors && hasRequiredFields && hasValidValues;
    };

    const selectedTemplate = templatesPricingMechanism.find(t => t.value === pricingMechanism.curveType);


    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onHeaderClick(stepKey)}
            >
                <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Price Mechanism</div>
                {isFormValid() ? (
                    <CircleCheck className="w-5 h-5 text-green-500" />
                ) : isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <>
                    <p className="text-gray-500 text-sm mb-6">
                        Configure a bonding curve to determine token price based on supply.
                    </p>

                    {!pricingMechanism.curveType && (
                        <>
                            <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                                <img src="/icons/lightbulb-checkmark.svg" alt="Lightbulb Checkmark" className="w-8 h-8" />
                                <div>
                                    <span className="font-semibold text-sm">What is Bonding Curve</span>
                                    <p className="text-gray-600 text-xs mt-1">
                                        A bonding curve automatically adjusts token price based on supply. As more tokens are purchased, the price increases according to a mathematical formula, creating a fair market mechanism
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6 flex flex-col">
                                <h3 className="text-base font-semibold">Choose a Template</h3>
                                <p className="text-gray-500 text-sm">
                                    Select a pre-configured template or customize your own curve.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                {templatesPricingMechanism.map((template, index) => {
                                    const isAvailable = template.value === 'linear';
                                    const isComingSoon = !isAvailable;
                                    const minHeight = template.value === 'custom' ? '120px' : '220px';
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`${template.color} rounded-lg p-5 flex flex-col justify-between ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                            style={{ minHeight }}
                                            onClick={() => isAvailable && handleSelectTemplate(template)}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <img src={template.icon} alt={template.label} className="w-7 h-7" />
                                                <span className="font-semibold text-base">{template.label}</span>
                                            </div>
                                            <p className="text-gray-600 text-xs mb-3">{template.description}</p>
                                            {template.longDescription && (
                                                <p className="text-gray-600 text-xs mb-3">{template.longDescription}</p>
                                            )}
                                            {template.type && (
                                                <div className="text-sm space-y-2 mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-xs min-w-[80px] whitespace-nowrap">Curve Type:</span>
                                                        <span className="text-xs">{template.type}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-xs min-w-[80px] whitespace-nowrap">Price Range:</span>
                                                        <span className="text-xs">{template.priceRange}</span>
                                                    </div>
                                                    <div className="flex items-start justify-between">
                                                        <span className="font-semibold text-xs min-w-[80px] whitespace-nowrap">Used by:</span>
                                                        <span className="text-xs block text-right">{template.usedBy}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className={`mt-auto border rounded-md py-2 flex flex-row justify-center items-center gap-2 text-sm transition ${
                                                    isAvailable 
                                                        ? 'bg-white border-gray-300 hover:bg-opacity-80' 
                                                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                } ${template.style}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isAvailable) {
                                                        handleSelectTemplate(template);
                                                    }
                                                }}
                                                disabled={isComingSoon}
                                            >
                                                <span>{isAvailable ? 'Select' : 'Coming Soon'}</span>
                                                {isAvailable && <ArrowRight className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {selectedTemplate && (
                        <div className="mt-8">
                            <div className="mb-6 flex flex-col">
                                <label className="block text-sm font-medium mb-1">Curve Type</label>
                                <select disabled className="w-full border disabled:bg-gray-100 border-gray-300 capitalize rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value={selectedTemplate.value}>{selectedTemplate.value}</option>    
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Initial Price (SOL) <span className="text-red-500">*</span></label>
                                    <Input
                                        className={`w-full border ${validationErrors.initialPrice ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="initialPrice"
                                        value={pricingMechanism.initialPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.0000001"
                                    />
                                    {validationErrors.initialPrice && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.initialPrice}</p>
                                    )}
                                    {recommendations.initialPrice && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                                            <p className="text-yellow-600 text-xs">{recommendations.initialPrice}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Final Price (SOL) <span className="text-red-500">*</span></label>
                                    <Input
                                        className={`w-full border ${validationErrors.finalPrice ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="finalPrice"
                                        value={pricingMechanism.finalPrice}
                                        onChange={handleInputChange}
                                        placeholder="10"
                                    />
                                    {validationErrors.finalPrice && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.finalPrice}</p>
                                    )}
                                    {recommendations.finalPrice && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                                            <p className="text-yellow-600 text-xs">{recommendations.finalPrice}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Raise (SOL) <span className="text-red-500">*</span></label>
                                    <Input
                                        className={`w-full border ${validationErrors.targetRaise ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="targetRaise"
                                        value={pricingMechanism.targetRaise}
                                        onChange={handleInputChange}
                                        placeholder="100"
                                    />
                                    {validationErrors.targetRaise && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.targetRaise}</p>
                                    )}
                                    {recommendations.targetRaise && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                                            <p className="text-yellow-600 text-xs">{recommendations.targetRaise}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reserve Ratio (%) <span className="text-red-500">*</span></label>
                                    <Input
                                        className={`w-full border ${validationErrors.reserveRatio ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="reserveRatio"
                                        value={pricingMechanism.reserveRatio}
                                        onChange={handleInputChange}
                                        placeholder="20"
                                    />
                                    {validationErrors.reserveRatio && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.reserveRatio}</p>
                                    )}
                                    {recommendations.reserveRatio && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                                            <p className="text-yellow-600 text-xs">{recommendations.reserveRatio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <button
                                    className="bg-white border text-sm border-gray-300 rounded-md px-6 py-2 text-gray-700 hover:bg-gray-100 transition"
                                    onClick={handleBackToTemplates}
                                >
                                    Back to Templates
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}; 