import { ChevronDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChainType } from "@/types/bridge.types";
import { CHAINS, AVAILABLE_CHAINS } from "@/constants/bridge.constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChainSelectorProps {
    selectedChain: ChainType;
    onChainChange: (chain: ChainType) => void;
    label?: string;
    disabledChains?: ChainType[];
    disabledTooltips?: Partial<Record<ChainType, string>>;
}

export const ChainSelector = ({ selectedChain, onChainChange, label, disabledChains = [], disabledTooltips = {} }: ChainSelectorProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="border-none">
                <div
                    className="hover:bg-gray-100 p-1.5 sm:p-2 cursor-pointer rounded-lg"
                    role="button"
                    tabIndex={0}
                    aria-label={label || "Select chain"}
                >
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0">
                            <img
                                src={CHAINS[selectedChain].icon}
                                alt={CHAINS[selectedChain].name}
                                className="w-full h-full rounded-full"
                            />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{CHAINS[selectedChain].name}</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-white border border-gray-100">
                {AVAILABLE_CHAINS.map((chain) => {
                    const isDisabled = disabledChains.includes(chain);
                    const tooltipText = disabledTooltips[chain];

                    const item = (
                        <DropdownMenuItem
                            key={chain}
                            onSelect={(e) => {
                                e.preventDefault();
                                if (isDisabled) return;
                                onChainChange(chain);
                            }}
                            className={`flex items-center gap-2 ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
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
                    );

                    return tooltipText && isDisabled ? (
                        <Tooltip key={chain}>
                            <TooltipTrigger asChild>
                                {item}
                            </TooltipTrigger>
                            <TooltipContent className="border border-gray-200/60">
                                {tooltipText}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        item
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
