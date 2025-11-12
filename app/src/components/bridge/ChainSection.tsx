import { ChainType } from "@/types/bridge.types";
import { CHAINS } from "@/constants/bridge.constants";
import { truncateAddress } from "@/utils";
import { ChainSelector } from "./ChainSelector";
import { SOL_NETWORK } from "@/configs/env.config";

interface ChainSectionProps {
    chain: ChainType;
    onChainChange: (chain: ChainType) => void;
    walletAddress?: string;
    label: string;
    disabledChains?: ChainType[];
    disabledTooltips?: Partial<Record<ChainType, string>>;
}

export const ChainSection = ({ chain, onChainChange, walletAddress, label, disabledChains, disabledTooltips }: ChainSectionProps) => {
    const getExplorerUrl = () => {
        if (!walletAddress) return "#";

        switch (chain) {
            case 'solana':
                return `${CHAINS[chain].explorerUrl}/account/${walletAddress}${SOL_NETWORK === "devnet" ? "?cluster=devnet" : ""}`;
            case 'near':
            case 'ethereum':
                return `${CHAINS[chain].explorerUrl}/address/${walletAddress}`;
            default:
                return "#";
        }
    };

    return (
        <div className="flex justify-between items-center mb-3 gap-2">
            <ChainSelector
                selectedChain={chain}
                onChainChange={onChainChange}
                label={label}
                disabledChains={disabledChains}
                disabledTooltips={disabledTooltips}
            />
            {walletAddress && (
                <a
                    href={getExplorerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-xs hover:underline shrink-0"
                >
                    {truncateAddress(walletAddress)}
                </a>
            )}
        </div>
    );
};
