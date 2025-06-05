import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { InfoIcon } from 'lucide-react';

const cards = [
  {
    title: 'Fair Launch',
    desc: 'Equal opportunity for all participants at the same price.',
    pricing: [
      { label: 'Fixed Price', icon: <img src="/icons/dollar-sign.svg" alt="Dollar Sign" className="w-4 h-4 mr-1" />, color: 'bg-emerald-50 text-emerald-700' },
      { label: 'Bonding Curve', icon: <img src="/icons/line-chart.svg" alt="Bonding Curve" className="w-4 h-4 mr-1 text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
    ],
    value: 'fair-launch',
  },
  {
    title: 'Whitelist',
    desc: 'Only pre-approved addresses can participate initially',
    pricing: [
      { label: 'Fixed Price', icon: <img src="/icons/dollar-sign.svg" alt="Dollar Sign" className="w-4 h-4 mr-1" />, color: 'bg-emerald-50 text-emerald-700' },
      { label: 'Bonding Curve', icon: <img src="/icons/line-chart.svg" alt="Bonding Curve" className="w-4 h-4 mr-1 text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
    ],
    value: 'whitelist',
  },
  {
    title: 'Auction',
    desc: 'Price determined by market demand through bidding',
    pricing: [
      { label: 'Fixed Price', icon: <img src="/icons/dollar-sign.svg" alt="Dollar Sign" className="w-4 h-4 mr-1" />, color: 'bg-emerald-50 text-emerald-700' },
      { label: 'Bonding Curve', icon: <img src="/icons/line-chart.svg" alt="Bonding Curve" className="w-4 h-4 mr-1 text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
    ],
    value: 'auction',
  },
  {
    title: 'Whitelist Sale',
    desc: 'Only pre-approved addresses can participate initially',
    pricing: [
      { label: 'Fixed Price', icon: <img src="/icons/dollar-sign.svg" alt="Dollar Sign" className="w-4 h-4 mr-1" />, color: 'bg-emerald-50 text-emerald-700' },
      { label: 'Bonding Curve', icon: <img src="/icons/line-chart.svg" alt="Bonding Curve" className="w-4 h-4 mr-1 text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
    ],
    value: 'whitelist-sale',
  },
];

export const Exchanges = () => {
    const [selected, setSelected] = useState<string>('fair-launch');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, idx) => (
            <div 
                key={idx} 
                className={`h-full border border-gray-200 rounded-lg p-3 cursor-pointer ${selected === card.value ? 'border-gray-500 bg-gray-50' : ''}`} 
                onClick={() => setSelected(card.value)}
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
                        <Badge key={p.label} className={`flex items-center px-3 py-2 rounded-2xl shadow-none border border-gray-200 font-medium ${p.color}`}>{p.icon}{p.label}</Badge>
                    ))}
                    </div>
                </div>
            </div>
        ))}
        </div>
    );
};
