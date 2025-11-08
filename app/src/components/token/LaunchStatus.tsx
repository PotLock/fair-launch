"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ChevronDown, Check, Info, ChevronUp, TrendingUp, Clock, Zap } from "lucide-react";
import { LaunchStatusData, LaunchPhase } from "./LaunchStatusData";
import { formatTokenPrice, formatMarketCap, formatNumberToCurrency } from "@/utils";

interface LaunchStatusProps {
    data: LaunchStatusData;
}

export default function LaunchStatus({ data }: LaunchStatusProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const getPhaseInfo = (phase: LaunchPhase) => {
        switch (phase) {
            case "pre-launch":
                return {
                    title: "Pre-Launch",
                    description: "Token launch not started",
                    color: "bg-orange-500",
                    icon: Clock,
                    status: "Not Started"
                };
            case "live":
                return {
                    title: "Live Trading",
                    description: "Active on bonding curve",
                    color: "bg-green-500",
                    icon: TrendingUp,
                    status: "Live Now"
                };
            case "ready-to-migrate":
                return {
                    title: "Ready to Migrate",
                    description: "Bonding curve complete, ready for DEX",
                    color: "bg-blue-500",
                    icon: Zap,
                    status: "Ready"
                };
            case "migrated":
                return {
                    title: "DEX Trading",
                    description: "Live on Raydium",
                    color: "bg-green-500",
                    icon: TrendingUp,
                    status: "Active Now"
                };
            default:
                return {
                    title: "Unknown",
                    description: "Status unknown",
                    color: "bg-gray-500",
                    icon: Clock,
                    status: "Unknown"
                };
        }
    };

    const getProgressPercentage = () => {
        switch (data.phase) {
            case "pre-launch":
                return 0;
            case "live":
                // Show progress based on bonding curve progress (0-100%)
                return Math.min(data.progress * 100, 100);
            case "ready-to-migrate":
                return 100; // Bonding curve complete, ready for migration
            case "migrated":
                return 100; // Fully migrated to DEX
            default:
                return 0;
        }
    };

    const getPhaseSteps = () => {
        const steps = [
            {
                title: "Presale Phase",
                completed: data.phase !== "pre-launch",
                color: "bg-orange-500",
                description: data.baseSold > 0 ? `${formatNumberToCurrency(data.baseSold)} SOL raised` : "No SOL raised",
                status: data.baseSold > 0 ? "100% Complete" : "0% Complete",
                date: "Dec 15 - Dec 22"
            },
            {
                title: "Bonding Curve",
                completed: data.phase === "ready-to-migrate" || data.phase === "migrated",
                color: data.phase === "live" ? "bg-purple-500" : 
                       data.phase === "ready-to-migrate" || data.phase === "migrated" ? "bg-green-500" : "bg-gray-300",
                description: data.baseSold > 0 ? `${formatNumberToCurrency(data.baseSold)} SOL raised` : "No SOL raised",
                status: data.phase === "live" ? `${Math.round(data.progress * 100)}% Complete` : 
                        data.phase === "ready-to-migrate" || data.phase === "migrated" ? "100% Complete" : "0% Complete",
                date: "Dec 15 - Dec 28"
            },
            {
                title: "DEX Trading",
                completed: data.phase === "migrated",
                color: data.phase === "migrated" ? "bg-green-500" : "bg-gray-300",
                description: data.phase === "migrated" ? "Live on Raydium" : "Not yet available",
                status: data.phase === "migrated" ? "Active Now" : "Pending",
                date: data.phase === "migrated" ? "Since Dec 28" : "TBD"
            }
        ];
        return steps;
    };

    const phaseInfo = getPhaseInfo(data.phase);
    const progressPercentage = getProgressPercentage();
    const phaseSteps = getPhaseSteps();

    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200 flex flex-col gap-1">
            <h2 className="text-2xl font-medium mb-4">Launch Status</h2>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                    className={`${phaseInfo.color} h-2 rounded-full relative transition-all duration-500`} 
                    style={{ width: `${progressPercentage}%` }}
                >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-current rounded-full"></div>
                </div>
            </div>

            {isExpanded && (
                <div className="mb-6">
                    <div className="space-y-2">
                        {phaseSteps.map((step, index) => {
                            const IconComponent = step.completed ? Check : Clock;
                            const nextStep = phaseSteps[index + 1];
                            const showConnector = nextStep && !nextStep.completed;
                            
                            return (
                                <div key={step.title} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 ${step.color} rounded-full flex items-center justify-center`}>
                                            <IconComponent className="w-4 h-4 text-white" />
                                        </div>
                                        {showConnector && (
                                            <div className={`w-0.5 h-8 bg-gradient-to-b ${step.color} to-gray-300 mt-2`}></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{step.title}</h3>
                                            <Info className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-600">{step.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <p className={`text-sm font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                                            {step.status}
                                        </p>
                                        <p className="text-xs text-gray-500">{step.date}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-center mb-4">
                <button
                    onClick={toggleExpanded}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                    {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-red-500" />
                    ) : (
                        <ChevronDown className="w-6 h-6 text-red-500" />
                    )}
                </button>
            </div>

            <div className={`bg-gradient-to-r ${data.phase === 'migrated' ? 'from-green-50' : 'from-orange-50'} to-white rounded-lg p-3 md:p-4 border ${data.phase === 'migrated' ? 'border-green-200' : 'border-orange-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`${phaseInfo.color} text-white px-3 py-2 rounded-full flex items-center gap-1`}>
                            <phaseInfo.icon className="w-5 h-5" />
                            <span className="text-sm">{phaseInfo.title}</span>
                        </div>
                        <span className="text-sm text-gray-600 font-light">
                            {data.phase === 'pre-launch' ? 'Phase 1 of 3' : 
                             data.phase === 'live' ? 'Phase 2 of 3' : 
                             data.phase === 'ready-to-migrate' ? 'Phase 2 of 3' : 'Phase 3 of 3'}
                        </span>
                    </div>
                </div>

                <div className="md:grid flex flex-row grid-cols-3 items-center gap-20 mb-4">
                    <div className="space-y-1">
                        <div className="text-sm text-gray-600 mb-1 font-light">Current Price</div>
                        <div className={`text-2xl font-bold ${data.currentPrice > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            ${formatTokenPrice(data.currentPrice)}
                        </div>
                        {data.currentPrice > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                                <img src="/icons/arrow-right-up.svg" alt="arrow-right-up" className="w-4 h-4" />
                                <span>Live Price</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-gray-600 mb-1 font-light">Market Cap</div>
                        <div className="text-2xl font-bold">{formatMarketCap(data.marketCap)}</div>
                        <div className="text-xs text-gray-600 font-light">
                            {data.holders} holders
                        </div>
                    </div>
                    <div className="md:flex hidden flex-col items-center gap-2 ml-12">
                        <CircularProgress 
                            percentage={progressPercentage} 
                            size={120} 
                            strokeWidth={7}
                            color={data.phase === 'migrated' ? "#10b981" : "#3b82f6"}
                            backgroundColor="#e5e7eb"
                            sizeText={80}
                        />
                    </div>
                </div>

                <div className="flex md:flex-row flex-col md:items-center md:justify-between">
                    <div className="flex md:flex-row flex-col items-start md:items-center md:gap-4 justify-between">
                        {phaseSteps.map((step, index) => {
                            const nextStep = phaseSteps[index + 1];
                            const showConnector = nextStep;
                            
                            return (
                                <div key={step.title} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 ${step.color} rounded-full`}></div>
                                    <span className={`text-xs font-light ${step.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                                        {step.title} {step.completed ? 'Complete' : 'Pending'}
                                    </span>
                                    {showConnector && (
                                        <div className={`md:w-10 md:h-0.5 w-0.5 h-5 ml-1 md:ml-0 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="text-center hidden md:block ml-8">
                            <div className="text-[12px] font-medium">
                                {data.phase === 'migrated' ? 'Migration Complete' : 
                                 data.phase === 'ready-to-migrate' ? 'Ready to Migrate' :
                                 data.phase === 'live' ? 'In Progress' : 'Not Started'}
                            </div>
                            <div className="text-xs text-gray-600">
                                {data.baseSold > 0 ? `${formatNumberToCurrency(data.baseSold)} SOL raised` : 'No SOL raised'}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 mt-7 md:hidden">
                        <CircularProgress 
                            percentage={progressPercentage} 
                            size={120} 
                            strokeWidth={7}
                            color={data.phase === 'migrated' ? "#10b981" : "#3b82f6"}
                            backgroundColor="#e5e7eb"
                            sizeText={80}
                        />
                        <div className="text-center">
                            <div className="text-sm font-medium">
                                {data.phase === 'migrated' ? 'Migration Complete' : 
                                 data.phase === 'ready-to-migrate' ? 'Ready to Migrate' :
                                 data.phase === 'live' ? 'In Progress' : 'Not Started'}
                            </div>
                            <div className="text-xs text-gray-600">
                                {data.baseSold > 0 ? `${formatNumberToCurrency(data.baseSold)} SOL raised` : 'No SOL raised'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}