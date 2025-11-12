"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink, Minus, Plus } from "lucide-react";
import { getPoolConfigByMint, getPoolStateByMint } from "@/lib/api";
import { Token } from "@/types/api";
import { getSolPrice } from "@/lib/sol";
import { hexToNumber } from "@/utils";

interface LiquidityPoolsProps {
    onAddLiquidity: (isOpen: boolean) => void;
    token: Token;
}

interface PoolCard {
    id: string;
    name: string;
    poolAddress: string;
    token1Icon: string;
    token2Icon: string;
    platforms: {
        platform: string;
        platformIcon: string;
    }[];
    metrics: any[];
    isExpanded?: boolean;
    position?: {
        value: string;
        apr: string;
        poolShare: string;
    };
}

interface BlockchainSection {
    id: string;
    name: string;
    icon: string;
    poolCount: number;
    activeCount: number;
    pools: PoolCard[];
    isExpanded?: boolean;
    tags?: Array<{
        name: string;
        icon: string;
        variant?: "default" | "secondary" | "outline";
    }>;
}


const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    isExpanded ? <ChevronUp className="w-4 h-4 cursor-pointer" /> : <ChevronDown className="w-4 h-4 cursor-pointer" />
);

const PoolCard = ({ pool, onToggle, poolAddress }: { pool: PoolCard; onToggle: () => void; poolAddress: string }) => {

    const viewOnPlatForm = () =>{
        window.open(`https://devnet.meteora.ag/dlmm/${poolAddress}`, '_blank');
    }

    return (
        <Card className="p-3 md:p-4 mb-3 border border-gray-200 shadow-none rounded-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="flex -space-x-2 items-center flex-shrink-0">
                        <img
                            src={pool.token1Icon}
                            alt="Token 1"
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full"
                        />
                        <img
                            src={pool.token2Icon}
                            alt="Token 2"
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{pool.name}</h3>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {pool.platforms.map((platform, index) => (
                                <div key={index} className="flex items-center gap-1 border border-neutral-200 p-1 px-2 justify-center bg-neutral-50 rounded-full">
                                    <img src={platform.platformIcon} alt={platform.platform} className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-[10px] md:text-[11px] text-gray-600">{platform.platform}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end md:justify-start">
                    <Button  
                        onClick={viewOnPlatForm}
                        size="sm" 
                        className="text-[10px] md:text-xs bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-none cursor-pointer h-8 md:h-9 px-2 md:px-3"
                    >
                        <span className="hidden sm:inline">View on Meteora</span>
                        <span className="sm:hidden">Meteora</span>
                        <ExternalLink className="w-3 h-3"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="w-8 h-8 md:w-6 md:h-6 cursor-pointer flex-shrink-0"
                    >
                        <ChevronIcon isExpanded={pool.isExpanded || false} />
                    </Button>
                </div>
            </div>

        {pool.isExpanded && (
            <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
                    {pool.metrics.map((metric, index) => (
                        <div key={index} className="text-left md:text-center flex flex-col p-2 md:p-0">
                            <span className="text-[10px] md:text-xs text-gray-600 mb-1">{metric.label}</span>
                            <span
                                className={`text-xs md:text-sm font-medium truncate ${
                                    metric.isHighlighted ? "text-green-600" : ""
                                }`}
                            >
                                {metric.value}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border border-orange-200 rounded-lg p-3 md:p-4 bg-orange-50">
                    <h4 className="font-medium text-sm mb-3 text-orange-600">
                        Manage your Position
                    </h4>
                    <div className="flex flex-col md:flex-row md:justify-between gap-3 md:gap-4">
                        <div className="grid grid-cols-3 gap-3 md:gap-4 flex-1">
                            <div>
                                <div className="text-[10px] md:text-xs text-gray-600 mb-1">My Position</div>
                                <div className="text-xs md:text-sm font-medium">0</div>
                            </div>
                            <div>
                                <div className="text-[10px] md:text-xs text-gray-600 mb-1">APR</div>
                                <div className="text-xs md:text-sm font-medium">0</div>
                            </div>
                            <div>
                                <div className="text-[10px] md:text-xs text-gray-600 mb-1">Pool Share</div>
                                <div className="text-xs md:text-sm font-medium">0</div>
                            </div>
                        </div>
                        <div className="flex gap-2 md:gap-2 w-full md:w-auto">
                            <Button className="flex-1 md:flex-initial shadow-none bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 h-9 md:h-auto">
                                <Plus className="w-3 h-3"/>
                                <span className="text-xs">Add</span>
                            </Button>
                            <Button className="flex-1 md:flex-initial shadow-none bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 h-9 md:h-auto">
                                <Minus className="w-3 h-3"/>
                                <span className="text-xs">Remove</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        )}
        </Card>
    );
};


const BlockchainSection = ({
    section,
    onToggleSection,
    onTogglePool,
}: {
    section: BlockchainSection;
    onToggleSection: () => void;
    onTogglePool: (poolId: string) => void;
}) => {
    return (
        <Card className="mb-4 border border-gray-200 shadow-none p-0">
            <div
                className="p-4 cursor-pointer hover:bg-neutral-200 bg-neutral-100 rounded-xl transition-colors"
                onClick={onToggleSection}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={section.icon} alt={section.name} className="w-10 h-10 rounded-full" />
                        <div>
                            <h3 className="font-medium">{section.name}</h3>
                            <p className="text-sm">
                                {section.poolCount} pools • {section.activeCount} active
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                        <ChevronIcon isExpanded={section.isExpanded || false} />
                    </div>
                </div>
            </div>

            {section.isExpanded && section.pools.length > 0 && (
                <div className="px-4 pb-4 mt-3">
                    {section.pools.map((pool) => (
                        <PoolCard
                            key={pool.id}
                            pool={pool}
                            onToggle={() => onTogglePool(pool.id)}
                            poolAddress={pool.poolAddress}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
};


export function LiquidityPools({ token, onAddLiquidity }: LiquidityPoolsProps) {
    const [data, setData] = useState<BlockchainSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPools = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [solPrice, poolConfig, poolState] = await Promise.all([
                    getSolPrice(),
                    token?.mintAddress ? getPoolConfigByMint(token.mintAddress) : null,
                    token?.mintAddress ? getPoolStateByMint(token.mintAddress) : null
                ]);

                if(solPrice && poolConfig && poolState){
                    if (!poolState) {
                        setData([]);
                        return;
                    }

                    const quoteReserve = parseInt(poolState.account.quoteReserve);
                    const baseReserve = parseInt(poolState.account.baseReserve);
                    const totalLiquidityUSD = (hexToNumber(quoteReserve.toString()) / Math.pow(10, 9)) * solPrice * 2;
                    const volume24hUSD = 0;
                    const feeRate = (poolConfig.poolFees?.protocolFeePercent || 0) / 10000;
                    const fee24hUSD = volume24hUSD * feeRate;
                    const feeToTvl = totalLiquidityUSD > 0 ? fee24hUSD / totalLiquidityUSD : 0;

                    const feeEarnedUSD = volume24hUSD * feeRate;
                    const yourLPUSD = 0;

                    const dataPool = {
                        id: poolState.publicKey,
                        poolAddress: poolState.publicKey,
                        name: `${token.name}-SOL`,
                        token1Icon: token.metadata.tokenUri,
                        token2Icon: "/chains/solana-dark.svg", 
                        platforms: [
                            {
                                platform: "Meteora",
                                platformIcon: "/logos/meteora.png"
                            }
                        ],
                        metrics: [
                            { label: "Total Liquidity", value: totalLiquidityUSD.toString(), isHighlighted: false },
                            { label: "24h Volume", value: volume24hUSD.toString(), isHighlighted: false },
                            { label: "24h Fees/TVL", value: feeToTvl.toString(), isHighlighted: false },
                            { label: "Fee Earned", value: feeEarnedUSD.toString(), isHighlighted: false },
                            { label: "Your LP Position", value: yourLPUSD.toString(), isHighlighted: false }
                        ],
                        isExpanded: false,
                        position: {
                            value: "0",
                            apr: "0%",
                            poolShare: "0%"
                        }
                    };
                    
                    // Create a single blockchain section for Solana
                    const blockchainSection: BlockchainSection = {
                        id: "solana",
                        name: "Solana",
                        icon: "/chains/solana-dark.svg",
                        poolCount: 1,
                        activeCount: 1,
                        pools: [dataPool],
                        isExpanded: false
                    };
                    
                    setData([blockchainSection]);
                }
            } catch (err) {
                console.error('Error loading pools:', err);
                setError('Failed to load pool data');
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        
        loadPools();
    }, [token.mintAddress]);

    const toggleSection = (sectionId: string) => {
        setData((prev) =>
        prev.map((section) =>
            section.id === sectionId
            ? { ...section, isExpanded: !section.isExpanded }
            : section
        )
        );
    };

    const togglePool = (poolId: string) => {
        setData((prev) =>
        prev.map((section) => ({
            ...section,
            pools: section.pools.map((pool) =>
            pool.id === poolId
                ? { ...pool, isExpanded: !pool.isExpanded }
                : pool
            ),
        }))
        );
    };

    if (loading) {
        return (
            <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-medium mb-4">Liquidity Pools</h2>
                    {/* <Button 
                        className="flex items-center gap-1 bg-white shadow-none border border-gray-200 hover:bg-gray-100"
                        onClick={()=>onAddLiquidity(true)}  
                    >
                        <Plus className="w-3 h-3"/>
                        <span className="font-normal">Add Liquidity</span>
                    </Button> */}
                </div>
                <div className="space-y-4 mt-4">
                    <div className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-xl mb-4"></div>
                        <div className="h-16 bg-gray-200 rounded-xl mb-4"></div>
                        <div className="h-16 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-medium mb-4">Liquidity Pools</h2>
                    {/* <Button 
                        className="flex items-center gap-1 bg-white shadow-none border border-gray-200 hover:bg-gray-100"
                        onClick={()=>onAddLiquidity(true)}  
                    >
                        <Plus className="w-3 h-3"/>
                        <span className="font-normal">Add Liquidity</span>
                    </Button> */}
                </div>
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200 flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium mb-4">Liquidity Pools</h2>
                {/* <Button 
                    className="flex items-center gap-1 bg-white shadow-none border border-gray-200 hover:bg-gray-100"
                    onClick={()=>onAddLiquidity(true)}  
                >
                    <Plus className="w-3 h-3"/>
                    <span className="font-normal">{data.length === 0 ? "Create Pool" : "Add Liquidity"}</span>
                </Button> */}
            </div>

            <div className="space-y-4 mt-4">
                {data.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No liquidity pools found</p>
                        <Button 
                            onClick={() => onAddLiquidity(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            Create Your First Pool
                        </Button>
                    </div>
                ) : (
                    data.map((section) => (
                        <BlockchainSection
                            key={section.id}
                            section={section}
                            onToggleSection={() => toggleSection(section.id)}
                            onTogglePool={togglePool}
                        />
                    ))
                )}
            </div>
        </Card>
    );
}