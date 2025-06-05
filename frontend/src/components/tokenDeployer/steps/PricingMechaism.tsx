import { useState } from "react";
import { Badge } from "../../ui/badge";
import { InfoIcon } from "lucide-react";

const saleTypes = [
  {
    label: "Fair Launch",
    icon: <img src="/icons/rocket.svg" alt="Rocket" className="w-4 h-4 mr-1" />,
    color: "bg-emerald-50 text-green-600",
    value: "fair-launch",
  },
  {
    label: "Whitelist Sale",
    icon: <img src="/icons/list.svg" alt="List" className="w-4 h-4 mr-1" />,
    color: "bg-indigo-50 text-indigo-600",
    value: "whitelist-sale",
  },
  {
    label: "Fixed Price Sale",
    icon: <img src="/icons/tag.svg" alt="Tag" className="w-4 h-4 mr-1" />,
    color: "bg-yellow-50 text-yellow-700",
    value: "fixed-price-sale",
  },
];

const pricingOptions = [
  {
    key: "fixed-price",
    title: "Fixed Price",
    desc: "Set a specific price per token that doesn't change during the sale",
    badges: [saleTypes[0], saleTypes[1], saleTypes[2]],
  },
  {
    key: "bonding-curve",
    title: "Bonding Curve",
    desc: "Price increases automatically as more tokens are sold",
    badges: [saleTypes[0], saleTypes[1], saleTypes[2]],
  },
];

export const PricingMechaism = () => {
  const [selected, setSelected] = useState<string>("fixed-price");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {pricingOptions.map((option) => (
        <div
          key={option.key}
          className={`h-full border transition-all p-3 rounded-lg cursor-pointer ${selected === option.key ? "border-gray-500 bg-gray-50" : "border-gray-200"}`}
          onClick={() => setSelected(option.key)}
        >
          <div className="flex flex-col h-36 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{option.title}</span>
              <InfoIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-sm text-gray-500 mb-2">{option.desc}</div>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="border-b border-gray-200" />
              <div className="mt-2 text-sm mb-2">Works best with:</div>
              <div className="flex gap-3 flex-wrap">
                {option.badges.map((badge) => (
                  <Badge
                    key={badge.label}
                    className={`flex items-center px-2 py-1 border border-gray-200 rounded-2xl text-xs shadow-none font-medium ${badge.color}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};