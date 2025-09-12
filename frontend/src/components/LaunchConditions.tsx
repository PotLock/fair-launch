import { useEffect } from "react";
import { formatDateToReadable, formatNumberWithCommas, getPricingDisplay } from "../utils";
import { Card } from "./ui/card";
import { Copy, ChevronDown, ChevronUp, ExternalLink, ArrowLeftRight, Plus } from "lucide-react";
import { copyToClipboard } from "../utils";
import { useCallback, useState } from "react";
import { BridgeDeployModal } from "./BridgeDeployModal";
import { getBridgedAddressToken } from "../lib/omni-bridge";
import { NEAR_NETWORK, SOL_NETWORK } from "../configs/env.config";
import { Token } from "../types";
import { getSolPrice } from "../lib/sol";

interface LaunchConditionsProps {
    tokenInfo: Token;
    currentPrice: number;
}


export function LaunchConditions({ tokenInfo,currentPrice }: LaunchConditionsProps) {
    const [isContractExpanded, setIsContractExpanded] = useState<boolean>(false);
    const [isBridgeModalOpen, setIsBridgeModalOpen] = useState<boolean>(false);
    const [bridgeTokenAddresses, setBridgeTokenAddresses] = useState<string[]>([]);
    const [solPrice, setSolPrice] = useState<number | null>(null)

    const loadBridgeToken = useCallback(async () => {
        const bridgedAddresses = await getBridgedAddressToken(tokenInfo?.mintAddress || '')
        setBridgeTokenAddresses(bridgedAddresses || [])
    }, [tokenInfo?.mintAddress])

    const fetchSOLPrice = async() => {
        const price = await getSolPrice()
        setSolPrice(price)
    }

    useEffect(() => {
        loadBridgeToken()
        fetchSOLPrice()
    }, [loadBridgeToken])

    const parseBridgedAddresses = useCallback((addresses: string[]) => {
        return addresses.map(address => {
            // Parse address format: "near:sol-0x2d4e5ee3ee5386de80d095f2eef896a94fd471dd.omnidep.testnet"
            const parts = address.split(':');
            if (parts.length < 2) {
                console.warn('Invalid bridge address format:', address);
                return null;
            }
            
            const chainType = parts[0];
            const tokenAddress = parts[1];
            
            // Determine chain info based on chain type
            let chainInfo = {
                name: "Unknown",
                logo: "/chains/ethereum.svg",
                explorerUrl: ""
            };
            
            if (chainType === 'near') {
                chainInfo = {
                    name: "NEAR",
                    logo: "/chains/near-dark.svg",
                    explorerUrl: NEAR_NETWORK == "testnet" ? `https://testnet.nearblocks.io/address/${tokenAddress}` : `https://nearblocks.io/address/${tokenAddress}`
                };
            } else if (chainType === 'eth') {
                chainInfo = {
                    name: "Ethereum",
                    logo: "/chains/ethereum.svg",
                    explorerUrl: "https://etherscan.io/token/"
                };
            }
            
            const shortAddress = tokenAddress.length > 20 
                ? `${tokenAddress.substring(0, 10)}...${tokenAddress.substring(tokenAddress.length - 10)}`
                : tokenAddress;
            
            return {
                name: chainInfo.name,
                logo: chainInfo.logo,
                address: shortAddress,
                fullAddress: tokenAddress,
                status: "Deployed",
                explorerUrl: chainInfo.explorerUrl
            };
        }).filter((chain): chain is NonNullable<typeof chain> => chain !== null);
    }, []);

    const bridgedChains = parseBridgedAddresses(bridgeTokenAddresses).filter(chain => chain !== null);
    
    const solanaChain = tokenInfo?.mintAddress ? {
        name: "Solana",
        logo: "/chains/solana-dark.svg",
        address: tokenInfo.mintAddress.length > 20 ? 
            `${tokenInfo.mintAddress.substring(0, 10)}...${tokenInfo.mintAddress.substring(tokenInfo.mintAddress.length - 10)}` : 
            tokenInfo.mintAddress,
        fullAddress: tokenInfo.mintAddress,
        status: "Deployed",
        explorerUrl: SOL_NETWORK == "devnet" ? `https://solscan.io/token/${tokenInfo.mintAddress}?cluster=devnet` : `https://solscan.io/token/${tokenInfo.mintAddress}`
    } : null;
    
    const deployedChains = [
        ...(solanaChain ? [solanaChain] : []),
        ...bridgedChains
    ];


    return (
        <Card className="p-3 md:p-6 mb-6 shadow-none">
            <h2 className="text-xl font-medium mb-4">Launch Conditions</h2>
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
                        <p className="text-sm font-semibold">{formatNumberWithCommas(tokenInfo?.targetRaise)} SOL</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Percentage</p>
                        <p className="text-sm font-semibold">{tokenInfo?.liquidityPercentage}%</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Launch Date</p>
                        <p className="text-sm font-semibold">{formatDateToReadable(tokenInfo?.launchDate)}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Launch Mechanism</p>
                        <p className="text-sm font-semibold">{getPricingDisplay(tokenInfo?.selectedPricing || '')}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Max Contribution</p>
                        <p className="text-sm font-semibold">{tokenInfo?.maximumContribution} SOL</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Hard cap</p>
                        <p className="text-sm font-semibold">${formatNumberWithCommas(Number(tokenInfo?.hardCap) * (solPrice || 0))}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Source</p>
                        <p className="text-sm font-semibold capitalize">{tokenInfo?.liquiditySource}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                        <p className="text-sm text-gray-500 mb-1">Liquidity Lockup</p>
                        <p className="text-sm font-semibold">{tokenInfo?.liquidityLockupPeriod} days</p>
                    </div>
                </div>
            </div>
            
            
            <div className="mt-3">
                <div className="flex items-center md:items-start justify-between mb-4">
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
                                <div className="items-center gap-1 hidden md:flex">
                                    {deployedChains.length > 0 ? (
                                        <>
                                            <div className="flex -space-x-1">
                                                {deployedChains.map((chain, index) => (
                                                    <div key={chain.name} className="w-8 h-8 bg-black p-1 rounded-full border-2 border-white flex items-center justify-center">
                                                        <img src={chain.logo} alt={chain.name} className="w-5 h-5" />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-600 ml-2">
                                                {tokenInfo?.symbol || 'Token'} is deployed on {deployedChains.length} chains
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500">
                                            Loading deployed chains...
                                        </span>
                                    )}
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
                {
                    !isContractExpanded && (
                        <div className="flex items-center gap-1 md:hidden">
                            {deployedChains.length > 0 ? (
                                <>
                                    <div className="flex -space-x-1">
                                        {deployedChains.map((chain, index) => (
                                            <div key={chain.name} className="w-8 h-8 bg-black p-1 rounded-full border-2 border-white flex items-center justify-center">
                                                <img src={chain.logo} alt={chain.name} className="w-5 h-5" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 ml-2">
                                        {tokenInfo?.symbol || 'Token'} is deployed on {deployedChains.length} chains
                                    </span>
                                </>
                            ) : (
                                <span className="text-sm text-gray-500">
                                    Loading deployed chains...
                                </span>
                            )}
                        </div>
                    )
                }
                
                {isContractExpanded && (
                    <div className="space-y-2">
                        {deployedChains.length > 0 ? (
                            deployedChains.map((chain) => (
                                <div key={chain.name} className="flex items-center justify-between p-2 md:p-3 border border-gray-200 rounded-lg bg-white">
                                    <div className="flex items-center gap-1.5 md:gap-3">
                                        <div className="md:w-8 md:h-8 w-7 h-7 rounded-full flex justify-center items-center">
                                            <img src={chain.logo} alt={chain.name} className="w-full h-full" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 text-sm md:text-base">{chain.name}</span>
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] md:text-xs rounded-full">
                                                    {chain.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <p className="text-[10px] md:text-xs text-gray-600 font-light">{chain.address}</p>
                                                <button 
                                                    className="p-1 hover:bg-gray-100 rounded block md:hidden"
                                                    onClick={() => copyToClipboard(chain.fullAddress)}
                                                >
                                                    <Copy className="w-3.5 h-3.5 text-gray-600" />
                                                </button>
                                                <a 
                                                    href={chain.explorerUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-gray-100 rounded block md:hidden"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setIsBridgeModalOpen(true)}
                                            className="flex items-center gap-1 px-3 py-1 text-xs md:text-sm border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                            <ArrowLeftRight className="w-3 h-3" />
                                            Bridge
                                        </button>
                                        <button 
                                            className="p-1 hover:bg-gray-100 rounded hidden md:block"
                                            onClick={() => copyToClipboard(chain.fullAddress)}
                                        >
                                            <Copy className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <a 
                                            href={chain.explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 hover:bg-gray-100 rounded hidden md:block"
                                        >
                                            <ExternalLink className="w-4 h-4 text-gray-600" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                <p>Loading deployed chains...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <BridgeDeployModal 
                isOpen={isBridgeModalOpen}
                onClose={() => setIsBridgeModalOpen(false)}
                bridgeAddress={bridgeTokenAddresses}
                tokenInfo={tokenInfo}
                currentPrice={currentPrice}
                refetchBridgeAddress={loadBridgeToken}
            />
        </Card>
    );
}