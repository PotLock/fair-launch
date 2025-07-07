import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, CircleCheck } from "lucide-react";
import { templatesPricingMechanism } from "../../../lib/pricingMechanism";
import { PricingTemplate } from "../../../types";
import { Input } from "../../ui/input";
import { useDeployStore } from "../../../stores/deployStores";

export const PricingMechanism = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
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
                onClick={() => setIsExpanded(!isExpanded)}
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
                                {templatesPricingMechanism.map((template, index) => (
                                    <div 
                                        key={index} 
                                        className={`${template.color} rounded-lg p-5 flex flex-col justify-between min-h-[${template.value === 'custom' ? '120px' : '220px'}]`}
                                        onClick={() => handleSelectTemplate(template)}
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
                                            className={`mt-auto bg-white border border-gray-300 rounded-md py-2 flex flex-row justify-center items-center gap-2 text-sm hover:bg-opacity-80 transition ${template.style}`}
                                            onClick={() => handleSelectTemplate(template)}
                                        >
                                            <span>Select</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
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
                                    <label className="block text-sm font-medium mb-1">Initial Price (SOL)</label>
                                    <Input
                                        className={`w-full border ${validationErrors.initialPrice ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="initialPrice"
                                        value={pricingMechanism.initialPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.005"
                                    />
                                    {validationErrors.initialPrice && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.initialPrice}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Final Price (SOL)</label>
                                    <Input
                                        className={`w-full border ${validationErrors.finalPrice ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="finalPrice"
                                        value={pricingMechanism.finalPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.02"
                                    />
                                    {validationErrors.finalPrice && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.finalPrice}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Raise (SOL)</label>
                                    <Input
                                        className={`w-full border ${validationErrors.targetRaise ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="targetRaise"
                                        value={pricingMechanism.targetRaise}
                                        onChange={handleInputChange}
                                        placeholder="1000"
                                    />
                                    {validationErrors.targetRaise && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.targetRaise}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reserve Ratio (%)</label>
                                    <Input
                                        className={`w-full border ${validationErrors.reserveRatio ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        type="number"
                                        name="reserveRatio"
                                        value={pricingMechanism.reserveRatio}
                                        onChange={handleInputChange}
                                        placeholder="70"
                                    />
                                    {validationErrors.reserveRatio && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.reserveRatio}</p>
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