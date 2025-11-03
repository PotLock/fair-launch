import { ChevronDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChainType } from "@/types/bridge.types";
import { CHAINS, AVAILABLE_CHAINS } from "@/constants/bridge.constants";

interface ChainSelectorProps {
    selectedChain: ChainType;
    onChainChange: (chain: ChainType) => void;
    label?: string;
}

export const ChainSelector = ({ selectedChain, onChainChange, label }: ChainSelectorProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="border-none">
                <div
                    className="hover:bg-gray-100 p-2 cursor-pointer rounded-lg"
                    role="button"
                    tabIndex={0}
                    aria-label={label || "Select chain"}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
                            <img
                                src={CHAINS[selectedChain].icon}
                                alt={CHAINS[selectedChain].name}
                                className="w-full h-full rounded-full"
                            />
                        </div>
                        <span className="text-sm font-medium">{CHAINS[selectedChain].name}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-white border border-gray-100">
                {AVAILABLE_CHAINS.map((chain) => (
                    <DropdownMenuItem
                        key={chain}
                        onSelect={(e) => {
                            e.preventDefault();
                            onChainChange(chain);
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
                            <img
                                src={CHAINS[chain].icon}
                                alt={CHAINS[chain].name}
                                className="w-full h-full rounded-full"
                            />
                        </div>
                        <span className="text-sm">{CHAINS[chain].name}</span>
                        {selectedChain === chain && <Check className="w-4 h-4 ml-auto text-green-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
