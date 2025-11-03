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
}

export const ChainSection = ({ chain, onChainChange, walletAddress, label }: ChainSectionProps) => {
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
        <div className="flex justify-between items-center mb-3">
            <ChainSelector
                selectedChain={chain}
                onChainChange={onChainChange}
                label={label}
            />
            {walletAddress && (
                <a
                    href={getExplorerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:underline"
                >
                    {truncateAddress(walletAddress)}
                </a>
            )}
        </div>
    );
};
