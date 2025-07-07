import { Badge } from '../../ui/badge';
import { InfoIcon } from 'lucide-react';
import { useDeployStore } from '../../../stores/deployStores';
import { exchanges } from '../../../lib/exchanges';

export const Exchanges = () => {
    const { selectedExchange, setSelectedExchange } = useDeployStore();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exchanges.map((card, idx) => (
            <div 
                key={idx} 
                className={`h-full border border-gray-200 rounded-lg p-3 cursor-pointer ${selectedExchange === card.value ? 'border-gray-500 bg-gray-50' : ''}`} 
                onClick={() => setSelectedExchange(card.value)}
            >
                <div className="pb-2 flex-row items-center gap-2 flex justify-between">
                    <div className="flex items-center gap-2">
                    <p className="font-semibold">{card.title}</p>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <div className="pt-0">
                    <p className="mb-4 text-sm text-gray-500">{card.desc}</p>
                    <div className="border-b border-gray-200 my-3" />
                    <div className="text-sm mb-2">Compatible Pricing Mechanism</div>
                    <div className="flex gap-3">
                    {card.pricing.map((p) => (
                        <Badge key={p.label} className={`flex items-center px-3 py-2 rounded-2xl shadow-none border border-gray-200 font-medium ${p.color}`}>
                          <img src={p.icon as string} alt={p.label} className="w-4 h-4 mr-1" />
                          {p.label}
                        </Badge>
                    ))}
                    </div>
                </div>
            </div>
        ))}
        </div>
    );
};
