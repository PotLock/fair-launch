import { useDeployStore } from '../../../stores/deployStores';
import { tokenTemplates } from '../../../lib/templates';
import { exchanges } from '../../../lib/exchanges';

export const PreviewSelection = () => {
    const { selectedTemplate, selectedPricing, selectedExchange } = useDeployStore();

    const getTemplateDisplay = (template: string) => {
        const templateData = tokenTemplates.find(t => t.key === template);
        return templateData?.label || template.charAt(0).toUpperCase() + template.slice(1);
    };

    const getPricingDisplay = (pricing: string) => {
        return pricing.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const getExchangeDisplay = (exchange: string) => {
        const exchangeData = exchanges.find(e => e.value === exchange);
        return exchangeData?.title || exchange.charAt(0).toUpperCase() + exchange.slice(1);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-5">

                <div className="flex flex-col items-start">
                    <span className="text-gray-400 text-sm font-medium mb-1">Token Template</span>
                    <div className="flex items-center gap-2">
                        <img src="/icons/meme-token.svg" alt="Rocket" className="w-6 h-6 mr-1" />
                        <span className="font-bold text-base">{getTemplateDisplay(selectedTemplate)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-start">
                    <span className="text-gray-400 text-sm font-medium mb-1">Launch Type</span>
                    <span className="font-bold text-base">{getExchangeDisplay(selectedExchange)}</span>
                </div>

                <div className="flex flex-col items-start">
                    <span className="text-gray-400 text-sm font-medium mb-1">Pricing Mechanism</span>
                    <span className="font-bold text-base">{getPricingDisplay(selectedPricing)}</span>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="font-semibold text-sm mb-1">What happens next?</div>
                <div className="text-gray-700 text-xs">
                    After confirming your selection, you'll be able to customize detailed settings for your token, including supply, allocations, vesting schedules, and more specific parameters for your chosen launch type and pricing mechanism.
                </div>
            </div>
        </div>
    );
}