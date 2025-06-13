import { Input } from "../../ui/input";
import { useState } from "react";
import { ChevronDown, ChevronUp, CircleCheck } from "lucide-react";
import { useDeployStore } from "../../../stores/deployStores";
import { TokenSaleSetup as TokenSaleSetupType } from "../../../types";
import { getExchangeDisplay } from "../../../utils";

export const TokenSaleSetup = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { selectedExchange, saleSetup, updateSaleSetup, validationErrors, validateSaleSetup } = useDeployStore();

    const handleInputChange = (field: keyof TokenSaleSetupType, value: string | number) => {
        updateSaleSetup({ [field]: value });
        validateSaleSetup();
    };

    const handleScheduleChange = (field: keyof TokenSaleSetupType['scheduleLaunch'], value: string | boolean) => {
        updateSaleSetup({
            scheduleLaunch: {
                ...saleSetup.scheduleLaunch,
                [field]: value
            }
        });
        validateSaleSetup();
    };

    const getError = (field: string) => {
        return validationErrors[field] ? (
            <p className="text-xs text-red-500 mt-1">{validationErrors[field]}</p>
        ) : null;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Token Sale Setup</div>
                {Object.keys(validationErrors).length === 0 ? (
                    <CircleCheck className="w-5 h-5 text-green-500" />
                ) : isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <div className="space-y-6">
                    <p className="text-xs text-gray-500">
                        Configure your token launch parameters. The launchpad will help you distribute your tokens to initial investors
                    </p>

                    <div>
                        <label className="block text-sm font-medium mb-1">Launch Type</label>
                        <Input type="text" value={getExchangeDisplay(selectedExchange)} readOnly className="bg-muted-foreground/10" />
                        <p className="text-xs text-muted-foreground mt-1">
                            In a fair launch, all participants have equal opportunity to acquire tokens at the same price.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Soft Cap</label>
                            <Input 
                                type="text" 
                                placeholder="0.02" 
                                value={saleSetup.softCap}
                                onChange={(e) => handleInputChange('softCap', e.target.value)}
                                className={validationErrors.softCap ? 'border-red-500' : ''}
                            />
                            {getError('softCap')}
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimum amount to raise for the launch to be considered successful
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Hard Cap</label>
                            <Input 
                                placeholder="720" 
                                value={saleSetup.hardCap}
                                onChange={(e) => handleInputChange('hardCap', e.target.value)}
                                className={validationErrors.hardCap ? 'border-red-500' : ''}
                            />
                            {getError('hardCap')}
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum amount that can be raised in the public sale.
                            </p>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg">
                        <div className={`flex ${saleSetup.scheduleLaunch.isEnabled ? 'bg-gray-50 border-b border-gray-200 rounded-t-lg mb-2' : 'bg-white rounded-lg'} p-3 items-center justify-between`}>
                            <label className="text-sm font-medium">Schedule Launch</label>
                            <button
                                onClick={() => handleScheduleChange('isEnabled', !saleSetup.scheduleLaunch.isEnabled)}
                                className={`
                                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                    ${saleSetup.scheduleLaunch.isEnabled ? 'bg-black' : 'bg-gray-200'}
                                `}
                            >
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                        ${saleSetup.scheduleLaunch.isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                            </button>
                        </div>
                        {saleSetup.scheduleLaunch.isEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Launch Date & Time</label>
                                    <Input 
                                        type="datetime-local" 
                                        value={saleSetup.scheduleLaunch.launchDate}
                                        onChange={(e) => handleScheduleChange('launchDate', e.target.value)}
                                        className={validationErrors.launchDate ? 'border-red-500' : ''}
                                    />
                                    {getError('launchDate')}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date & Time</label>
                                    <Input 
                                        type="datetime-local" 
                                        value={saleSetup.scheduleLaunch.endDate}
                                        onChange={(e) => handleScheduleChange('endDate', e.target.value)}
                                        className={validationErrors.endDate ? 'border-red-500' : ''}
                                    />
                                    {getError('endDate')}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Minimum Contribution</label>
                            <Input 
                                placeholder="0.1" 
                                value={saleSetup.minimumContribution}
                                onChange={(e) => handleInputChange('minimumContribution', e.target.value)}
                                className={validationErrors.minimumContribution ? 'border-red-500' : ''}
                            />
                            {getError('minimumContribution')}
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimum amount an investor can contribute
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Maximum Contribution</label>
                            <Input 
                                placeholder="10" 
                                value={saleSetup.maximumContribution}
                                onChange={(e) => handleInputChange('maximumContribution', e.target.value)}
                                className={validationErrors.maximumContribution ? 'border-red-500' : ''}
                            />
                            {getError('maximumContribution')}
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum amount an investor can contribute
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="flex flex-col gap-1 mb-4">
                            <h3 className="font-semibold text-base">Fair Launch Settings</h3>
                            <p className="text-xs text-muted-foreground">
                                In a fair launch, all participants have equal opportunity to acquire tokens at the same price.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Token Price</label>
                                <Input 
                                    placeholder="0.1" 
                                    value={saleSetup.tokenPrice}
                                    onChange={(e) => handleInputChange('tokenPrice', e.target.value)}
                                    className={validationErrors.tokenPrice ? 'border-red-500' : ''}
                                />
                                {getError('tokenPrice')}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Fixed price per token for all participants
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Max Tokens Per Wallet</label>
                                <Input 
                                    placeholder="1000" 
                                    value={saleSetup.maxTokenPerWallet}
                                    onChange={(e) => handleInputChange('maxTokenPerWallet', e.target.value)}
                                    className={validationErrors.maxTokenPerWallet ? 'border-red-500' : ''}
                                />
                                {getError('maxTokenPerWallet')}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Anti-whale measure to ensure fair distribution
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Distribution Delay (hours)</label>
                            <Input 
                                placeholder="24" 
                                value={saleSetup.distributionDelay}
                                onChange={(e) => handleInputChange('distributionDelay', Number(e.target.value))}
                                className={validationErrors.distributionDelay ? 'border-red-500' : ''}
                            />
                            {getError('distributionDelay')}
                            <p className="text-xs text-muted-foreground mt-1">
                                Time delay after sale ends before tokens are distributed (0 for immediate)
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};