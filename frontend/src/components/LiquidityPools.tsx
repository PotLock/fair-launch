import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp, ExternalLink, Minus, Plus } from "lucide-react";


interface LiquidityPoolsProps {
    onAddLiquidity: (isOpen: boolean) => void;
}
interface PoolMetric {
    label: string;
    value: string;
    isHighlighted?: boolean;
}

interface PoolCard {
    id: string;
    name: string;
    token1Icon: string;
    token2Icon: string;
    platforms: {
        platform: string;
        platformIcon: string;
    }[];
    metrics: PoolMetric[];
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


const liquidityData: BlockchainSection[] = [
    {
        id: "solana",
        name: "Solana",
        icon: "/chains/solana_light.svg",
        poolCount: 2,
        activeCount: 2,
        isExpanded: false,
        pools: [
            {
                id: "curate-sol",
                name: "CURATE-SOL",
                token1Icon: "https://gateway.pinata.cloud/ipfs/QmYN7vFLxgW4X8WuoV5RPJhxRCdU8edH7izSVTwrSLh1D7",
                token2Icon: "/chains/solana_light.svg",
                platforms: [
                    {
                        platform: "Raydium",
                        platformIcon: "/logos/raydium.png",
                    },
                    {
                        platform: "Solana",
                        platformIcon: "/chains/solana_light.svg",
                    }
                ],
                isExpanded: false,
                metrics: [
                    { label: "Total Liquidity", value: "$1.5M" },
                    { label: "24h Volume", value: "$45K" },
                    { label: "24h Fee/TVL", value: "0.051%" },
                    { label: "Fee Earned", value: "$53.4" },
                    { label: "Your LP Position", value: "$25,000", isHighlighted: true },
                ],
            },
            {
                id: "curate-usdc",
                name: "CURATE-USDC",
                token1Icon: "https://gateway.pinata.cloud/ipfs/QmYN7vFLxgW4X8WuoV5RPJhxRCdU8edH7izSVTwrSLh1D7",
                token2Icon: "/icons/usdc.svg",
                platforms: [
                    {
                        platform: "Raydium",
                        platformIcon: "/logos/raydium.png",
                    },
                    {
                        platform: "Solana",
                        platformIcon: "/chains/solana_light.svg",
                    }
                ],
                isExpanded: false,
                metrics: [
                    { label: "Total Liquidity", value: "$1.5M" },
                    { label: "24h Volume", value: "$45K" },
                    { label: "24h Fee/TVL", value: "0.051%" },
                    { label: "Fee Earned", value: "$53.4" },
                    { label: "Your LP Position", value: "$25,000", isHighlighted: true },
                ],
                position: {
                    value: "$25,000",
                    apr: "18.4%",
                    poolShare: "0.12%",
                },
            },
        ],
    }
];

const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
);

const PoolCard = ({ pool, onToggle }: { pool: PoolCard; onToggle: () => void }) => {
    return (
        <Card className="p-4 mb-3 border border-gray-200 shadow-none rounded-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 items-center">
                        <img
                            src={pool.token1Icon}
                            alt="Token 1"
                            className="w-8 h-8 rounded-full"
                        />
                        {
                            pool.id.includes("sol") ? (
                                <div className="w-8 h-8 bg-black flex justify-center items-center rounded-full">
                                    <img
                                        src={pool.token2Icon}
                                        alt="Token 2"
                                        className="w-6 h-6 rounded-full"
                                    />
                                </div>
                            ): (
                                <img
                                    src={pool.token2Icon}
                                    alt="Token 2"
                                    className="w-9 h-9 rounded-full"
                                />
                            )
                        }
                    </div>
                    <div>
                        <h3 className="font-medium text-sm">{pool.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                            {pool.platforms.map((platform, index) => (
                                <div key={index} className="flex items-center gap-1 border border-neutral-200 p-1 px-2 justify-center bg-neutral-50 rounded-full">
                                    <img src={platform.platformIcon} alt={platform.platform} className="w-3 h-3" />
                                    <span className="text-[11px] text-gray-600">{platform.platform}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pool.platforms.map((platform, index) => (
                        platform.platform !== "Solana" && (
                            <Button key={index} size="sm" className="text-xs bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-none">
                                View on {platform.platform}
                                <ExternalLink  className="w-3 h-3"/>
                            </Button>
                        )
                    ))}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="w-6 h-6"
                    >
                        <ChevronIcon isExpanded={pool.isExpanded || false} />
                    </Button>
                </div>
            </div>

        {pool.isExpanded && (
            <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    {pool.metrics.map((metric, index) => (
                        <div key={index} className="text-center flex flex-col">
                            <span className="text-xs text-gray-600 mb-1">{metric.label}</span>
                            <span
                                className={`text-sm font-medium ${
                                    metric.isHighlighted ? "text-green-600" : ""
                                }`}
                            >
                                {metric.value}
                            </span>
                        </div>
                    ))}
                </div>

                {pool.position ? (
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <h4 className="font-medium text-sm mb-3 text-orange-600">
                            Manage your Position
                        </h4>
                        <div className="flex justify-between gap-4 mb-3">
                            <div>
                                <div className="text-xs text-gray-600 mb-1">My Position</div>
                                <div className="text-sm font-medium">{pool.position.value}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 mb-1">APR</div>
                                <div className="text-sm font-medium">{pool.position.apr}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 mb-1">Pool Share</div>
                                <div className="text-sm font-medium">{pool.position.poolShare}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1 shadow-none bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                                    <Plus className="w-3 h-3"/>
                                    <span className="text-xs">Add</span>
                                </Button>
                                <Button className="flex-1 shadow-none bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                                    <Minus className="w-3 h-3"/>
                                    <span className="text-xs">Remove</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-lg p-6 bg-white text-center">
                        <h4 className="font-medium text-base mb-2 text-gray-900">
                            No Liquidity Available
                        </h4>
                        <p className="text-xs text-gray-600 mb-4">
                            This Pool hasn't been created yet. Be the first to add Liquidity
                        </p>
                        <Button className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 mx-auto">
                            <Plus className="w-4 h-4" />
                            <span className="font-normal">Create Pool</span>
                        </Button>
                    </div>
                )}
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
        <Card className="mb-4 border border-gray-200 shadow-none">
            <div
                className="p-4 cursor-pointer hover:bg-neutral-200 bg-neutral-100 rounded-xl transition-colors"
                onClick={onToggleSection}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-black flex justify-center items-center rounded-full">
                            <img src={section.icon} alt={section.name} className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-medium">{section.name}</h3>
                            <p className="text-sm">
                                {section.poolCount} pools • {section.activeCount} active
                            </p>
                        </div>
                    </div>
                <div className="flex items-center gap-2">
                    {section.tags && (
                        <div className="flex gap-1">
                            {section.tags.map((tag, index) => (
                            <Badge
                                key={index}
                                variant={tag.variant || "default"}
                                className="text-xs px-2 py-1"
                            >
                                <img src={tag.icon} alt={tag.name} className="w-3 h-3 mr-1" />
                                {tag.name}
                            </Badge>
                            ))}
                        </div>
                    )}
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
                        />
                    ))}
                </div>
            )}
        </Card>
    );
};


export function LiquidityPools({ onAddLiquidity }: LiquidityPoolsProps) {
    const [data, setData] = useState(liquidityData);

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

    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium mb-4">Liquidity Pools</h2>
                <Button 
                    className="flex items-center gap-1 bg-white shadow-none border border-gray-200 hover:bg-gray-100"
                    onClick={()=>onAddLiquidity(true)}  
                >
                    <Plus className="w-3 h-3"/>
                    <span className="font-normal">Add Liquidity</span>
                </Button>
            </div>

            <div className="space-y-4 mt-4">
                {data.map((section) => (
                    <BlockchainSection
                        key={section.id}
                        section={section}
                        onToggleSection={() => toggleSection(section.id)}
                        onTogglePool={togglePool}
                    />
                ))}
            </div>
        </Card>
    );
}