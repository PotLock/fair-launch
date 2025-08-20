import { useState } from "react";
import { Card } from "./ui/card";
import { CircularProgress } from "./ui/circular-progress";
import { ChevronDown, Check, BarChart3, Info, ChevronUp, TrendingUp } from "lucide-react";

export function LaunchStatus() {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200">
            <h2 className="text-xl font-medium mb-4">Launch Status</h2>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-green-500 h-2 rounded-full relative" style={{ width: '100%' }}>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-green-500 rounded-full"></div>
                </div>
            </div>

            {isExpanded && (
                <div className="mb-6">
                    <div className="space-y-2">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                <div className="w-0.5 h-8 bg-gradient-to-b from-orange-500 to-purple-500 mt-2"></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium">Presale Phase</h3>
                                    <Info className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600">750 SOL raised</p>
                            </div>
                            <div className="flex items-end flex-col gap-1">
                                <p className="text-sm text-green-600 font-normal">100% Complete</p>
                                <p className="text-xs text-gray-500">Dec 15 - Dec 22</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500 to-black mt-2"></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium">Bonding Curve</h3>
                                    <Info className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600">750 SOL raised</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <p className="text-sm text-green-600 font-medium">100% Complete</p>
                                <p className="text-xs text-gray-500">Dec 15 - Dec 28</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium">DEX Trading</h3>
                                    <Info className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600">Live on Raydium</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <p className="text-sm text-green-600 font-medium">Active Now</p>
                                <p className="text-xs text-gray-500">Since Dec 28</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center mb-4">
                <button
                    onClick={toggleExpanded}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-red-500" />
                    ) : (
                        <ChevronDown className="w-6 h-6 text-red-500" />
                    )}
                </button>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 text-white px-3 py-2 rounded-full flex items-center gap-1">
                            <img src="/icons/course-up.svg" alt="course-up" className="w-5 h-5" />
                            <span className="text-sm">Live Trading</span>
                        </div>
                        <span className="text-sm text-gray-600 font-light">Phase 3 of 3</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-20 mb-4">
                    <div className="space-y-1">
                        <div className="text-sm text-gray-600 mb-1 font-light">Current Price</div>
                        <div className="text-2xl font-bold text-green-600">$0.0521</div>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <img src="/icons/arrow-right-up.svg" alt="arrow-right-up" className="w-4 h-4" />
                            <span>+12.5% (24h)</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-gray-600 mb-1 font-light">Market Cap</div>
                        <div className="text-2xl font-bold">$2.3M</div>
                        <div className="text-xs text-gray-600 font-light">Rank #1,247</div>
                    </div>
                    <div className="flex flex-col items-center gap-2 ml-12">
                        <CircularProgress 
                            percentage={100} 
                            size={120} 
                            strokeWidth={7}
                            color="#10b981"
                            backgroundColor="#e5e7eb"
                            sizeText={80}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 font-light">Presale Complete</span>
                        </div>
                        <div className="w-10 rounded-full h-0.5 bg-green-500"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 font-light">Bonding Curve Complete</span>
                        </div>
                        <div className="w-10 rounded-full h-0.5 bg-green-500"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                            <span className="text-sm text-green-600">Trading Live</span>
                        </div>
                        <div className="ml-2 text-center">
                            <div className="text-sm font-medium">Target Reached</div>
                            <div className="text-xs text-gray-600">1,500 / 1,500 SOL</div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}