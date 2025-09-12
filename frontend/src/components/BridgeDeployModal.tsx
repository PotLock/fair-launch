import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Card } from "./ui/card";
import { BadgeCheck, Check } from "lucide-react";
import { DeploymentOption, Token } from "../types";
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount } from 'wagmi';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { BridgeTokens } from "./BridgeTokens";
import { NEAR_NETWORK, SOL_NETWORK } from "../configs/env.config";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "react-hot-toast"
import { getSolBalance } from "../lib/sol";
import { getNearBalance } from "../lib/near";
import { useBridge } from "../hook/useBridge";
import { formatNumberWithCommas } from "../utils";
import { ChainKind } from "omni-bridge-sdk";

interface BridgeDeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    bridgeAddress: string[];
    tokenInfo: Token;
    currentPrice: number;
    refetchBridgeAddress: () => Promise<void>;
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
        estimatedTime: "2-5 minutes",
        disabled: true
    },
    {
        name: "NEAR",
        logo: "/chains/near-dark.svg",
        description: "Deploy to Near mainnet.",
        availableDexes: "RHEA Finance",
        cost: "3.25 NEAR",
        estimatedTime: "1-3 minutes",
        disabled: false
    }
];

export function BridgeDeployModal({ isOpen, onClose, bridgeAddress, tokenInfo, currentPrice, refetchBridgeAddress }: BridgeDeployModalProps) {
    const defaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
    const [activeTab, setActiveTab] = useState<"bridge" | "create">(defaultTab);
    const [selectedOption, setSelectedOption] = useState<DeploymentOption | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deploymentProgress, setDeploymentProgress] = useState(0);

    // BridgeTokens modal states
    const [showBridgeProcessingModal, setShowBridgeProcessingModal] = useState(false);
    const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
    const [bridgeProgress, setBridgeProgress] = useState(0);
    const [bridgeTransactionHash, setBridgeTransactionHash] = useState<string>('');
    const [bridgeTransactionHashNear, setBridgeTransactionHashNear] = useState<string>('');
    const [bridgeAmount, setBridgeAmount] = useState<string>('');
    const [bridgeFromChain, setBridgeFromChain] = useState<string>('');
    const [bridgeToChain, setBridgeToChain] = useState<string>('');

    const { signedAccountId } = useWalletSelector()
    const { address: evmAddress } = useAccount();
    const { isSolanaConnected,solanaPublicKey } = useWalletContext();

    const { 
        deployToken
    } = useBridge();

    // Update active tab when bridge address changes
    useEffect(() => {
        const newDefaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
        setActiveTab(newDefaultTab);
    }, [bridgeAddress]);

    const handleOptionSelect = (option: DeploymentOption) => {
        if (option.disabled) {
            return; // Don't allow selection of disabled options
        }
        setSelectedOption(option);
        setShowReviewModal(true);
    };

    const handleContinue = () => {
        setShowReviewModal(false);
        setShowConfirmModal(true);
    };

    const handleDeploy = async () => {
        setShowConfirmModal(false);
        setShowProcessingModal(true);
        setDeploymentProgress(0);

        if (!isSolanaConnected || !solanaPublicKey) {
            toast.error('Please connect your Solana wallet first');
            setShowProcessingModal(false);
            return;
        }

        if(selectedOption?.name === "NEAR"){
            if(!signedAccountId){
                toast.error('Please connect your NEAR wallet first');
                setShowProcessingModal(false);
                return;
            }
        }

        if(selectedOption?.name === "ETH"){
            if(!evmAddress){
                toast.error('Please connect your EVM wallet first');
                setShowProcessingModal(false);
                return;
            }
        }

        try {
            // Step 1: Starting deployment process (10%)
            setDeploymentProgress(10);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Check balances (30%)
            setDeploymentProgress(30);
            const solBalance = await getSolBalance(solanaPublicKey || '')
            
            if(solBalance < 0.0001){
                toast.error('Insufficient balance to deploy token, balance need >= 0.0001 SOL');
                setShowProcessingModal(false);
                return;
            }

            const nearBalance = await getNearBalance(signedAccountId || '')
        
            if(Number(nearBalance) < 3){
                toast.error('Insufficient balance to deploy token, balance need >= 3 NEAR');
                setShowProcessingModal(false);
                return;
            }

            // Step 3: Deploying token (60%)
            setDeploymentProgress(60);
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet"
            await deployToken(network,ChainKind.Sol,ChainKind.Near,tokenInfo?.mintAddress);

            // Step 4: Finalizing deployment (100%)
            setDeploymentProgress(100);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await refetchBridgeAddress()
            setShowProcessingModal(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Deployment failed. Please try again.');
            setShowProcessingModal(false);
        }
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
        setShowSuccessModal(false);
        setSelectedOption(null);
        setActiveTab("bridge");
    };

    const handleBridgeProcessingStart = (amount: string, fromChain: string, toChain: string) => {
        setBridgeAmount(amount);
        setBridgeFromChain(fromChain);
        setBridgeToChain(toChain);
        setBridgeProgress(0);
        setShowBridgeProcessingModal(true);
    };

    const handleBridgeProcessingComplete = (transactionHash: string, transactionHashNear: string) => {
        setBridgeTransactionHash(transactionHash);
        setBridgeTransactionHashNear(transactionHashNear);
        setShowBridgeProcessingModal(false);
        setShowBridgeSuccessModal(true);
    };

    const handleBridgeError = () => {
        setShowBridgeProcessingModal(false);
        setBridgeTransactionHash('');
        setBridgeTransactionHashNear('');
        setBridgeProgress(0);
    };

    const handleBridgeSuccessClose = () => {
        setShowBridgeSuccessModal(false);
        setBridgeAmount('');
        setBridgeFromChain('');
        setBridgeToChain('');
        setBridgeTransactionHash('');
        setBridgeTransactionHashNear('');
        setBridgeProgress(0);
    };

    const handleBridgeProgress = (progress: number) => {
        setBridgeProgress(progress);
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(bridgeAddress[-1]);
    };

    const handleViewOnExplorer = () => {
        if(selectedOption?.name == "NEAR"){
            window.open(`https://${NEAR_NETWORK == "testnet" && "testnet."}nearblocks.io/address/${bridgeAddress[-1]}`, "_blank");
        }
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

    // Determine which modal should be shown
    const shouldShowMainModal = isOpen && !showReviewModal && !showConfirmModal && !showProcessingModal && !showSuccessModal && !showBridgeProcessingModal && !showBridgeSuccessModal;
    
    return (
        <>
            {/* Main Modal */}
            <Dialog open={shouldShowMainModal} onOpenChange={onClose}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg max-h-[95vh] overflow-y-hidde [&>button]:hidden">
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

                        <TabsContent value="bridge" className="mt-6">
                            <BridgeTokens
                                tokenInfo={tokenInfo}
                                chains={chains}
                                onClose={onClose}
                                onBridgeProcessingStart={handleBridgeProcessingStart}
                                onBridgeProcessingComplete={handleBridgeProcessingComplete}
                                onBridgeSuccessClose={handleBridgeSuccessClose}
                                onBridgeError={handleBridgeError}
                                onBridgeProgress={handleBridgeProgress}
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
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center justify-between p-2 px-3 border rounded-lg transition-colors ${
                                                    option.disabled
                                                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                                        : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                                                }`}
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
                                                        <h3 className={`font-semibold text-sm ${
                                                            option.disabled ? 'text-gray-500' : 'text-gray-900'
                                                        }`}>
                                                            {option.name}
                                                        </h3>
                                                        <p className={`text-xs ${
                                                            option.disabled ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {option.description}
                                                        </p>
                                                        <p className={`text-xs font-extralight ${
                                                            option.disabled ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                            Available DEXes: {option.availableDexes}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right space-y-1">
                                                    <div className={`text-sm font-medium ${
                                                        option.disabled ? 'text-gray-500' : 'text-gray-900'
                                                    }`}>
                                                        {option.cost}
                                                    </div>
                                                    <div className={`text-xs ${
                                                        option.disabled ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        {option.estimatedTime}
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        {option.disabled && (
                                            <TooltipContent className="bg-white border border-gray-100">
                                                <p>Coming Soon</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {
                        activeTab === "create" && (
                            <div className="flex justify-end gap-3 mt-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="px-6"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )
                    }
                </DialogContent>
            </Dialog>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Create {tokenInfo?.symbol} on {selectedOption?.name} for Bridging
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
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
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
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {tokenInfo?.symbol} to {selectedOption?.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Review the details before proceeding
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <img src={selectedOption?.logo} alt={selectedOption?.name} className="h-12 w-12" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Deploying {tokenInfo?.symbol}
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
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {tokenInfo?.symbol} to {selectedOption?.name}
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
                                {tokenInfo?.symbol} is now available on {selectedOption?.name}
                            </p>
                        </div>

                        <div className="text-left flex justify-between items-center mb-6">
                            <h4 className="text-sm font-medium text-gray-600">New Contract Address</h4>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-mono text-gray-700">{bridgeAddress[-1]}</span>
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

            {/* Bridge Processing Modal */}
            <Dialog open={showBridgeProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {tokenInfo?.symbol} from {bridgeFromChain} to {bridgeToChain}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Transferring your tokens across chains
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center gap-4">
                                <img src="/chains/solana-dark.svg" alt="Solana" className="h-12 w-12" />
                                <div className="text-2xl">→</div>
                                <img src="/chains/near-dark.svg" alt="NEAR" className="h-12 w-12" />
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Bridging {formatNumberWithCommas(bridgeAmount)} {tokenInfo?.symbol}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Transferring from {bridgeFromChain} to {bridgeToChain}
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${bridgeProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {bridgeProgress}% complete
                        </p>

                        <p className="text-sm text-gray-500">
                            Please don't close this window. Bridge typically takes 1-2 minutes.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bridge Success Modal */}
            <Dialog open={showBridgeSuccessModal} onOpenChange={handleBridgeSuccessClose}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {tokenInfo?.symbol} from {bridgeFromChain} to {bridgeToChain}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Transfer completed successfully
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
                                Bridge Successful!
                            </h3>
                            <p className="text-sm font-extralight text-gray-600">
                                {formatNumberWithCommas(bridgeAmount)} {tokenInfo?.symbol} has been bridged from {bridgeFromChain} to {bridgeToChain}
                            </p>
                        </div>

                        {bridgeTransactionHash && (
                            <div className="text-left flex justify-between items-center mb-6">
                                <h4 className="text-sm font-medium text-gray-600">Transaction Hash</h4>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-mono text-gray-700 max-w-[200px]">
                                        {bridgeTransactionHash.length > 50 
                                            ? `${bridgeTransactionHash.slice(0, 12)}...${bridgeTransactionHash.slice(-8)}`
                                            : bridgeTransactionHash
                                        }
                                    </span>
                                    <div className="flex">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(bridgeTransactionHash)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="Copy transaction hash"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => window.open(`https://solscan.io/tx/${bridgeTransactionHash}?cluster=devnet`, "_blank")}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="View on explorer"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {bridgeTransactionHashNear && (
                            <div className="text-left flex justify-between items-center mb-6">
                                <h4 className="text-sm font-medium text-gray-600">NEAR Transaction Hash</h4>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-mono text-gray-700 max-w-[200px]">
                                        {bridgeTransactionHashNear.length > 50 
                                            ? `${bridgeTransactionHashNear.slice(0, 12)}...${bridgeTransactionHashNear.slice(-8)}`
                                            : bridgeTransactionHashNear
                                        }
                                    </span>
                                    <div className="flex">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(bridgeTransactionHashNear)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="Copy transaction hash"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => window.open(`https://testnet.nearblocks.io/en/txns/${bridgeTransactionHashNear}`, "_blank")}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="View on explorer"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-red-50 border border-red-200 text-start rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-red-600 mb-3">What's Next?</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-green-600"/>
                                    <span className="text-sm text-gray-700">Tokens bridged successfully</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-gray-600"/>
                                    <span className="text-sm text-gray-700">You can now use your tokens on {bridgeToChain}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleBridgeSuccessClose}
                            className="px-6"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 