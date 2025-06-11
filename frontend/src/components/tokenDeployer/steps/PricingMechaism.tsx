import { Badge } from "../../ui/badge";
import { InfoIcon } from "lucide-react";
import { pricingOptions } from "../../../lib/pricings";
import { useDeployStore } from "../../../stores/deployStores";

export const PricingMechaism = () => {
  const { selectedPricing, setSelectedPricing } = useDeployStore();

  const handleSelect = (key: string) => {
    setSelectedPricing(key);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {pricingOptions.map((option) => (
        <div
          key={option.key}
          className={`h-full border transition-all p-3 rounded-lg cursor-pointer ${selectedPricing === option.key ? "border-gray-500 bg-gray-50" : "border-gray-200"}`}
          onClick={() => handleSelect(option.key)}
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
                    <img src={badge.icon as string} alt={badge.label} className="w-4 h-4 mr-1" />
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