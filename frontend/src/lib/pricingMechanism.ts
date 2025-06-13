import { PricingTemplate } from "../types";

export const templatesPricingMechanism: PricingTemplate[] = [
    {
        label: "Gentle Growth",
        description: "Gradual price increase, good for community tokens",
        type: "Linear",
        priceRange: "0.005 - 0.02 SOL",
        usedBy: "Community tokens, Social tokens",
        icon: "/icons/chart-increasing.svg",
        color: "bg-blue-50 border border-blue-200",
        style: "hover:bg-blue-200 hover:border-blue-300",
        value: "linear"
    },
    {
        label: "Modern Growth",
        description: "Balanced price increase, suitable for most projects",
        type: "Exponential",
        priceRange: "0.005 - 0.02 SOL",
        usedBy: "DeFi tokens, Utility tokens",
        icon: "/icons/rocket3d.svg",
        color: "bg-green-50 border border-green-200",
        style: "hover:bg-green-200 hover:border-green-300",
        value: "exponential"
    },
    {
        label: "Aggressive Growth",
        description: "Rapid price increase, rewards early adopters significantly",
        type: "Exponential",
        priceRange: "0.005 - 0.02 SOL",
        usedBy: "Gaming tokens, NFT project tokens",
        icon: "/icons/fire.svg",
        color: "bg-orange-50 border border-orange-200",
        style: "hover:bg-orange-200 hover:border-orange-300",
        value: "exponential"
    },
    {
        label: "Early Adopter Incentives",
        description: "Rapid initial growth that slows over time",
        type: "Logarithmic",
        priceRange: "0.005 - 0.02 SOL",
        usedBy: "Platform token, Governance token",
        icon: "/icons/direct-hit.svg",
        color: "bg-purple-50 border border-purple-200",
        style: "hover:bg-purple-200 hover:border-purple-300",
        value: "logarithmic"
    },
    {
        label: "Custom Configuration",
        description: "Create your own custom bonding curve",
        longDescription: "Configure all parameters manually for complete control over your token's price curve.",
        icon: "/icons/setting.svg",
        color: "bg-gray-50 border border-gray-200",
        style: "hover:bg-gray-200 hover:border-gray-400",
        value: "custom"
    }
] as const;