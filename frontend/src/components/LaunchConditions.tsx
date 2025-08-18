import { formatNumberWithCommas } from "../utils";
import { TokenInfo } from "../utils/tokenUtils";
import { Card } from "./ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Copy, ChevronDown, ChevronUp, ExternalLink, ArrowLeftRight, Plus } from "lucide-react";
import { truncateAddress,copyToClipboard } from "../utils";
import { useState } from "react";
import { BridgeDeployModal } from "./BridgeDeployModal";

interface LaunchConditionsProps {
    tokenInfo: TokenInfo;
}

const deployedChains = [
    {
        name: "Solana",
        logo: "/chains/solana_light.svg",
        address: "8sWkTMrhoVbWuW......qvJNgS2f7jo",
        fullAddress: "8sWkTMrhoVbWuW1234567890abcdefqvJNgS2f7jo",
        status: "Deployed",
        explorerUrl: "https://solscan.io/token/"
    },
    {
        name: "NEAR",
        logo: "/chains/near_light.svg", 
        address: "curate.token.near",
        fullAddress: "curate.token.near",
        status: "Deployed",
        explorerUrl: "https://explorer.near.org/accounts/"
    }
];


export function LaunchConditions({ tokenInfo }: LaunchConditionsProps) {
    const [isContractExpanded, setIsContractExpanded] = useState(false);
    const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);

    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none">
            <h2 className="text-xl font-medium mb-4">Tokenomics & Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 gap-3 mt-5 border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Total supply</p>
                        <p className="text-sm font-semibold">{formatNumberWithCommas(tokenInfo?.supply || 0)}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Min. Contribution</p>
                        <p className="text-sm font-semibold">{tokenInfo?.minimumContribution} SOL</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Target Raise</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Percentage</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Launch Date</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Launch Mechanism</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Max Contribution</p>
                        <p className="text-sm font-semibold">{tokenInfo?.maximumContribution} SOL</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Hard cap</p>
                        <p className="text-sm font-semibold">{tokenInfo?.hardCap} SOL</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Source</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Lockup</p>
                        <p className="text-sm font-semibold">-</p>
                    </div>
                </div>
            </div>
            
            {/* Contract Addresses Section */}
            <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsContractExpanded(!isContractExpanded)}
                                className="flex items-center gap-2 text-gray-700 font-normal text-sm hover:text-gray-900"
                            >
                                Contract Addresses
                                {isContractExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>                            
                        </div>
                        {
                            !isContractExpanded && (
                                <div className="flex items-center gap-1">
                                    <div className="flex -space-x-1">
                                        {deployedChains.map((chain, index) => (
                                            <div key={chain.name} className="w-8 h-8 bg-black p-1 rounded-full border-2 border-white flex items-center justify-center">
                                                <img src={chain.logo} alt={chain.name} className="w-5 h-5" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 ml-2">
                                        CURATE is deployed on {deployedChains.length} chains
                                    </span>
                                </div>
                            )
                        }
                    </div>
                    <button 
                        onClick={() => setIsBridgeModalOpen(true)}
                        className="flex items-center text-xs gap-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Bridge / Deploy
                    </button>
                </div>
                
                {isContractExpanded && (
                    <div className="space-y-2">
                        {deployedChains.map((chain) => (
                            <div key={chain.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-black rounded-full flex justify-center items-center  ">
                                        <img src={chain.logo} alt={chain.name} className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{chain.name}</span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                {chain.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-light">{chain.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                                        <ArrowLeftRight className="w-3 h-3" />
                                        Bridge
                                    </button>
                                    <button 
                                        className="p-1 hover:bg-gray-100 rounded"
                                        onClick={() => copyToClipboard(chain.fullAddress)}
                                    >
                                        <Copy className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <a 
                                        href={`${chain.explorerUrl}${chain.fullAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-600" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Bridge Deploy Modal */}
            <BridgeDeployModal 
                isOpen={isBridgeModalOpen}
                onClose={() => setIsBridgeModalOpen(false)}
            />
        </Card>
    );
}