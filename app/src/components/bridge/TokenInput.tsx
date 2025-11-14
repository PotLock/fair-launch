import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Token, ChainType } from "@/types/bridge.types";
import { TokenSelectSkeleton } from "@/components/ui/token-select-skeleton";
import { formatNumberInput, formatNumberToCurrency } from "@/utils";
import { CHAINS } from "@/constants/bridge.constants";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TokenInputProps {
    amount: string;
    onAmountChange: (value: string) => void;
    selectedToken?: Token;
    onTokenSelectClick: () => void;
    onHalfAmount: () => void;
    onMaxAmount: () => void;
    chain: ChainType;
    isLoading: boolean;
    isDisabled: boolean;
    isReadOnly?: boolean;
}

export const TokenInput = ({
    amount,
    onAmountChange,
    selectedToken,
    onTokenSelectClick,
    onHalfAmount,
    onMaxAmount,
    chain,
    isLoading,
    isDisabled,
    isReadOnly = false
}: TokenInputProps) => {

    const iconUrl = selectedToken?.icon.startsWith('https') ? selectedToken?.icon : `${process.env.NEXT_PUBLIC_IPFS_URL}${selectedToken?.icon}`;

    return (
        <>
            <div className="flex justify-between items-center gap-2">
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                        if (!isReadOnly) {
                            const formattedValue = formatNumberInput(e.target.value);
                            onAmountChange(formattedValue);
                        }
                    }}
                    className={`text-xl sm:text-2xl font-semibold border-none outline-none bg-transparent flex-1 min-w-0 ${isReadOnly ? 'text-gray-400' : ''}`}
                    placeholder={isReadOnly ? "0.00" : "0"}
                    disabled={isDisabled || isReadOnly}
                    readOnly={isReadOnly}
                />
                {isReadOnly ? (
                    <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-2 rounded-lg border border-gray-200 shrink-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                            {isLoading ? (
                                <TokenSelectSkeleton />
                            ) : (
                                <>
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center relative">
                                        <img
                                            src={iconUrl || '/chains/near-dark.svg'}
                                            alt={selectedToken?.symbol || 'NEAR'}
                                            className="w-full h-full rounded-full"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex items-center justify-center">
                                            <img
                                                src={CHAINS[chain].icon}
                                                alt={CHAINS[chain].name}
                                                className="w-full h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                        {selectedToken?.symbol || (!isLoading && 'NEAR')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block shrink-0">
                                <Button
                                    variant="outline"
                                    className="bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed border border-gray-200 hover:text-black cursor-pointer shadow-none text-xs sm:text-sm px-2 sm:px-3"
                                    onClick={onTokenSelectClick}
                                    disabled={isDisabled || isLoading}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {isLoading ? (
                                            <TokenSelectSkeleton />
                                        ) : (
                                            <>
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center relative">
                                                    <img
                                                        src={selectedToken?.icon || '/chains/solana-dark.svg'}
                                                        alt={selectedToken?.symbol || 'SOL'}
                                                        className="w-full h-full rounded-full"
                                                    />
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex items-center justify-center">
                                                        <img
                                                            src={CHAINS[chain].icon}
                                                            alt={CHAINS[chain].name}
                                                            className="w-full h-full rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs sm:text-sm font-medium">
                                                    {selectedToken?.symbol || (!isLoading && 'SOL')}
                                                </span>
                                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </>
                                        )}
                                    </div>
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {isDisabled && (
                            <TooltipContent className="border border-gray-100">
                                Please connect wallet address
                            </TooltipContent>
                        )}
                    </Tooltip>
                )}
            </div>

            <div className="flex justify-between items-center mt-2 gap-2">
                <span className="text-xs sm:text-sm text-gray-500">$ --</span>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
                    <span className="text-[10px] sm:text-xs text-gray-400">
                        {formatNumberToCurrency(Number(selectedToken?.balance))}
                    </span>
                    {isReadOnly ? (
                        <>
                            <button className="h-5 px-2 sm:px-3 text-[10px] sm:text-xs border border-gray-200 rounded" disabled>
                                50%
                            </button>
                            <button className="h-5 px-2 sm:px-3 text-[10px] sm:text-xs border border-gray-200 rounded" disabled>
                                Max
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="h-5 px-2 sm:px-3 text-[10px] sm:text-xs cursor-pointer hover:border-red-500 hover:text-red-500 border border-gray-200 rounded-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                                onClick={onHalfAmount}
                                disabled={isDisabled || !selectedToken}
                            >
                                50%
                            </button>
                            <button
                                className="h-5 px-2 sm:px-3 text-[10px] sm:text-xs cursor-pointer hover:border-red-500 hover:text-red-500 border border-gray-200 rounded-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                                onClick={onMaxAmount}
                                disabled={isDisabled || !selectedToken}
                            >
                                Max
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
