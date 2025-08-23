import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Card } from "./ui/card";
import { BadgeCheck, Check, ChevronDown } from "lucide-react";
import { DeploymentOption, Token } from "../types";
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount } from 'wagmi';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { BridgeTokens } from "./BridgeTokens";
import { NEAR_NETWORK, SOL_NETWORK } from "../configs/env.config";

interface BridgeDeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    bridgeAddress: string[];
    tokenInfo: Token;
    currentPrice: number;
}

interface Chain {
    name: string;
    logo: string;
    address: string;
    balance?: number;
    userAddress: string;
    price: number;
    explorerUrl: string;
}

const deploymentOptions: DeploymentOption[] = [
    {
        name: "Ethereum",
        logo: "/chains/ethereum.svg",
        description: "Deploy to Ethereum mainnet.",
        availableDexes: "Uniswap V3, SushiSwap",
        cost: "0.015",
        estimatedTime: "2-5 minutes"
    },
    {
        name: "NEAR",
        logo: "/chains/near-dark.svg",
        description: "Deploy to Near mainnet.",
        availableDexes: "RHEA Finance",
        cost: "3.25 NEAR",
        estimatedTime: "1-3 minutes"
    }
];

export function BridgeDeployModal({ isOpen, onClose, bridgeAddress, tokenInfo, currentPrice }: BridgeDeployModalProps) {
    const defaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
    const [activeTab, setActiveTab] = useState<"bridge" | "create">(defaultTab);
    const [selectedOption, setSelectedOption] = useState<DeploymentOption | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deploymentProgress, setDeploymentProgress] = useState(0);

    const { signedAccountId } = useWalletSelector()
    const { address: evmAddress } = useAccount();
    const { solanaPublicKey } = useWalletContext();
    

    // Update active tab when bridge address changes
    useEffect(() => {
        const newDefaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
        setActiveTab(newDefaultTab);
    }, [bridgeAddress]);


    const handleOptionSelect = (option: DeploymentOption) => {
        setSelectedOption(option);
        setShowReviewModal(true);
    };

    const handleContinue = () => {
        setShowReviewModal(false);
        setShowConfirmModal(true);
    };

    const handleDeploy = () => {
        setShowConfirmModal(false);
        setShowProcessingModal(true);
        setDeploymentProgress(0);
        
        // Simulate deployment progress
        const interval = setInterval(() => {
            setDeploymentProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setShowProcessingModal(false);
                    setShowSuccessModal(true);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
    };

    const handleCancel = () => {
        setShowReviewModal(false);
        setShowConfirmModal(false);
        setShowProcessingModal(false);
        setShowSuccessModal(false);
        setSelectedOption(null);
        setDeploymentProgress(0);
    };

    const handleBridgeNow = () => {
        // Handle bridge functionality
        console.log("Bridging tokens...");
        setShowSuccessModal(false);
        setSelectedOption(null);
        onClose();
    };



    const handleCopyAddress = () => {
        navigator.clipboard.writeText("0x2848f5...f9e242");
    };

    const handleViewOnExplorer = () => {
        window.open("https://basescan.org/address/0x2848f5...f9e242", "_blank");
    };

    const parseBridgedAddresses = useCallback((addresses: string[]) => {
        return addresses.map(address => {
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
                userAddress: '',
                price: currentPrice,
                explorerUrl: ''
            };
            
            if (chainType === 'near') {
                chainInfo = {
                    name: "NEAR",
                    logo: "/chains/near-dark.svg",
                    userAddress: signedAccountId?.toString() || '',
                    price: currentPrice,
                    explorerUrl: NEAR_NETWORK == "testnet" ? `https://testnet.nearblocks.io/address/${signedAccountId!}` : `https://nearblocks.io/address/${signedAccountId!}`
                };
            } else if (chainType === 'eth') {
                chainInfo = {
                    name: "ETHEREUM",
                    logo: "/chains/ethereum.svg",
                    userAddress: evmAddress?.toString() || '',
                    price: currentPrice,
                    explorerUrl: "https://etherscan.io/address/"
                };
            }
            
            return {
                name: chainInfo.name,
                logo: chainInfo.logo,
                address: tokenAddress,
                userAddress: chainInfo.userAddress,
                price: chainInfo.price,
                explorerUrl: chainInfo.explorerUrl
            };
        }).filter((chain): chain is NonNullable<typeof chain> => chain !== null);
    }, []);

    const bridgedChains = parseBridgedAddresses(bridgeAddress).filter(chain => chain !== null);
    

    const solanaChain = tokenInfo?.mintAddress ? {
        name: "SOLANA",
        logo: "/chains/solana-dark.svg",
        address: tokenInfo.mintAddress,
        userAddress: solanaPublicKey!,
        price: currentPrice,
        explorerUrl: SOL_NETWORK == "devnet" ? `https://solscan.io/account/${solanaPublicKey!}?cluster=devnet` : `https://solscan.io/account/${solanaPublicKey!}`
    } : null;
    
    const chains: Chain[] = [
        ...(solanaChain ? [solanaChain] : []),
        ...bridgedChains
    ];

    return (
        <>
            <Dialog open={isOpen && !showReviewModal && !showConfirmModal && !showProcessingModal && !showSuccessModal} onOpenChange={onClose}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg max-h-[95vh] overflow-y-hidden">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">
                            Deploy Bridge Contract
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "bridge" | "create")} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bridge" disabled={!bridgeAddress || bridgeAddress.length === 0}>
                                Bridge Tokens
                            </TabsTrigger>
                            <TabsTrigger value="create">Create on New Chain</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bridge" className="mt-6 overflow-y-auto max-h-[55vh]">
                            <BridgeTokens
                                tokenInfo={tokenInfo}
                                chains={chains}
                            />
                        </TabsContent>

                        <TabsContent value="create" className="mt-6 overflow-y-auto max-h-[50vh]">
                            {(!bridgeAddress || bridgeAddress.length === 0) && (
                                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-yellow-800">
                                                You need to create a bridge contract on a new chain before you can bridge tokens.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3">
                                {deploymentOptions.map((option, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleOptionSelect(option)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full flex items-center justify-center">
                                                <img
                                                    src={option.logo}
                                                    alt={option.name}
                                                    className="w-10 h-10"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="font-semibold text-sm text-gray-900">
                                                    {option.name}
                                                </h3>
                                                <p className="text-xs text-gray-600">
                                                    {option.description}
                                                </p>
                                                <p className="text-xs text-gray-500 font-extralight">
                                                    Available DEXes: {option.availableDexes}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right space-y-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {option.cost}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {option.estimatedTime}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        {
                            activeTab === "bridge" && (
                                <Button
                                    onClick={()=>{}}
                                    className="px-6 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Bridge Tokens
                                </Button>
                            ) 
                        }
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showReviewModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Create CURATE on {selectedOption?.name} for Bridging
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Review the details before proceeding
                        </p>
                    </DialogHeader>

                    <Card className="mt-1 space-y-5 shadow-none p-2 px-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Action:</span>
                            <span className="text-sm font-medium">Deploy Contract</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Target Chain:</span>
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedOption?.logo}
                                    alt={selectedOption?.name}
                                    className="w-5 h-5"
                                />
                                <span className="text-sm font-medium">{selectedOption?.name}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Fee:</span>
                            <span className="text-sm font-medium">{selectedOption?.cost}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contract Type:</span>
                            <span className="text-sm font-medium">ERC-20 Compatible</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Estimated Time:</span>
                            <span className="text-sm font-medium">{selectedOption?.estimatedTime}</span>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleContinue}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Deploy Modal */}
            <Dialog open={showConfirmModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Confirm Deploy to {selectedOption?.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Review the details before proceeding
                        </p>
                    </DialogHeader>

                    <Card className="space-y-5 shadow-none p-2 px-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Action:</span>
                            <span className="text-sm font-medium">Deploy Contract</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Target Chain:</span>
                            <div className="flex items-center gap-2">
                                <img
                                    src={selectedOption?.logo}
                                    alt={selectedOption?.name}
                                    className="w-5 h-5"
                                />
                                <span className="text-sm font-medium">{selectedOption?.name}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Fee:</span>
                            <span className="text-sm font-medium">{selectedOption?.cost}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Estimated Time:</span>
                            <span className="text-sm font-medium">{selectedOption?.estimatedTime}</span>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeploy}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Deploy Tokens
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Processing Modal */}
            <Dialog open={showProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy CURATE to {selectedOption?.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Review the details before proceeding
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Deploying CURATE
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Creating your token on {selectedOption?.name}
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${deploymentProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {deploymentProgress}% complete
                        </p>

                        <p className="text-sm text-gray-500">
                            Please don't close this window. Deployment typically takes 2-5 minutes.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy CURATE to {selectedOption?.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Review the details before proceeding
                        </p>
                    </DialogHeader>

                    <div className="text-center space-y-4 mt-2">
                        <div className="space-y-1 border-b border-gray-200 pb-4">
                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                                    <Check className="w-6 h-6 text-white"/>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-medium text-gray-900">
                                Deployment Successful!
                            </h3>
                            <p className="text-sm font-extralight text-gray-600">
                                CURATE is now available on {selectedOption?.name}
                            </p>
                        </div>

                        <div className="text-left flex justify-between items-center mb-6">
                            <h4 className="text-sm font-medium text-gray-600">New Contract Address</h4>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-mono text-gray-700">0x2848f5...f9e242</span>
                                <div className="flex">
                                    <button
                                        onClick={handleCopyAddress}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleViewOnExplorer}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 text-start rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-red-600 mb-3">What's Next?</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-green-600"/>
                                    <span className="text-sm text-gray-700">Bridge Contract Ready</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-gray-600"/>
                                    <span className="text-sm text-gray-700">Users can now bridge tokens between CURATE and {selectedOption?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-gray-600"/>
                                    <span className="text-sm text-gray-700">Create liquidity pools on Uniswap V3 or Sushiswap</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBridgeNow}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Bridge Now
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 