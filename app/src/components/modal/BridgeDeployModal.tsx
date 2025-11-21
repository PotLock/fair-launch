"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BadgeCheck, Check } from "lucide-react";
import { Token } from "@/types/api";
import { useWalletContext } from "@/contexts/WalletProviderContext";
import { useAccount, useConnect } from 'wagmi';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { BridgeTokensComponent } from "@/components/token/BridgeTokensComponent";
import { NEAR_NETWORK, SOL_NETWORK } from "@/configs/env.config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner"
import { getSolBalance } from "@/lib/sol";
import { getNearBalance } from "@/lib/near";
import { useBridge } from "@/hooks/useBridge";
import { formatNumberWithCommas } from "@/utils";
import { ChainKind } from "omni-bridge-sdk";
import { MIN_BALANCE, MIN_TARGET_BALANCE } from "@/constants/bridge.constants";
import { getAllBridgeTokens } from "@/lib/omni-bridge";
import { createTransaction, listTransactions, updateTransactionStatus } from "@/lib/api";
import { TransactionAction, TransactionStatus, TransactionChain } from "@/types/bridge.types";

interface BridgeDeployModalProps {
    isOpen: boolean;
    onClose: () => void;
    bridgeAddress: string[];
    token: Token;
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

interface DeploymentOption {
    name: string;
    logo: string;
    description: string;
    availableDexes: string;
    cost: string;
    disabled: boolean;
    chain: TransactionChain;
    isDeployed?: boolean;
}

interface DeploymentEstimateStats {
    averageMs: number;
    medianMs: number;
    p90Ms: number;
    sampleSize: number;
}

type IntervalTimer = ReturnType<typeof setInterval>;

const FALLBACK_DEPLOYMENT_ESTIMATE_MS = 90_000;

const deploymentOptions: DeploymentOption[] = [
    {
        name: "NEAR",
        logo: "/chains/near-dark.svg",
        description: "Deploy to Near mainnet.",
        availableDexes: "RHEA Finance",
        cost: "3.25 NEAR",
        disabled: false,
        chain: TransactionChain.NEAR
    },
    {
        name: "Ethereum",
        logo: "/chains/ethereum.svg",
        description: "Deploy to Ethereum mainnet.",
        availableDexes: "Uniswap V3, SushiSwap",
        cost: "0.015",
        disabled: true,
        chain: TransactionChain.ETHEREUM
    }
];

const formatDuration = (ms: number) => {
    if (!ms || !Number.isFinite(ms)) {
        return "Calculating...";
    }
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${seconds}s`;
};

const getPercentileValue = (sortedValues: number[], percentile: number) => {
    if (!sortedValues.length) {
        return 0;
    }
    if (sortedValues.length === 1) {
        return sortedValues[0];
    }
    const clampedPercentile = Math.min(Math.max(percentile, 0), 1);
    const index = Math.round((sortedValues.length - 1) * clampedPercentile);
    return sortedValues[Math.min(sortedValues.length - 1, Math.max(0, index))];
};

const extractErrorMessage = (error: unknown): string => {
    if (!error) {
        return 'Unknown error';
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error instanceof Error) {
        return error.message || 'Unknown error';
    }
    if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        return (error as any).message;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return 'Unknown error';
    }
};

const getFriendlyErrorMessage = (rawMessage: string, context: 'deploy' | 'bridge'): string => {
    const message = rawMessage?.toLowerCase() || '';

    const baseMessages = {
        deploy: 'We could not deploy the token. Please try again.',
        bridge: 'We could not bridge the token. Please try again.'
    } as const;

    if (!message) {
        return baseMessages[context];
    }

    if (message.includes('user rejected') || message.includes('user denied')) {
        return 'You rejected the transaction in your wallet. Please confirm again to continue.';
    }

    if (message.includes('insufficient') && message.includes('fund')) {
        return 'Insufficient wallet balance to complete the transaction. Please add more native tokens (gas).';
    }

    if (message.includes('insufficient') && message.includes('balance')) {
        return 'Your balance is insufficient for this transaction. Please check the amount.';
    }

    if (message.includes('time') && message.includes('out')) {
        return 'Transaction timed out. Check your network connection and try again.';
    }

    if (message.includes('network request failed') || message.includes('failed to fetch')) {
        return 'Cannot connect to server. Check your internet connection or RPC.';
    }

    if (message.includes('already being processed') || message.includes('already been processed')) {
        return 'Transaction has already been processed.';
    }

    if (message.includes('simulation failed')) {
        return 'Transaction simulation failed. Please try again in a few seconds or adjust parameters.';
    }

    return rawMessage || baseMessages[context];
};

export function BridgeDeployModal({ isOpen, onClose, bridgeAddress, token, currentPrice }: BridgeDeployModalProps) {
    const defaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
    const [activeTab, setActiveTab] = useState<"bridge" | "create">(defaultTab);
    const [selectedOption, setSelectedOption] = useState<DeploymentOption | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deploymentProgress, setDeploymentProgress] = useState(0);
    const [deploymentStartTime, setDeploymentStartTime] = useState<number>(0);
    const [deploymentElapsedTime, setDeploymentElapsedTime] = useState<string>('0s');
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('Calculating...');
    const [deploymentEstimates, setDeploymentEstimates] = useState<Partial<Record<TransactionChain, DeploymentEstimateStats>>>({});
    const [estimatesLoading, setEstimatesLoading] = useState(false);
    const [estimatesError, setEstimatesError] = useState<string | null>(null);
    const [selectedEstimateMs, setSelectedEstimateMs] = useState<number | null>(null);
    const [deploymentOptionsWithStatus, setDeploymentOptionsWithStatus] = useState<DeploymentOption[]>(deploymentOptions);

    // BridgeTokens modal states
    const [showBridgeProcessingModal, setShowBridgeProcessingModal] = useState(false);
    const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
    const [bridgeProgress, setBridgeProgress] = useState(0);
    const [bridgeTransactionHash, setBridgeTransactionHash] = useState<string>('');
    const [bridgeTransactionHashNear, setBridgeTransactionHashNear] = useState<string>('');
    const [bridgeAmount, setBridgeAmount] = useState<string>('');
    const [bridgeFromChain, setBridgeFromChain] = useState<string>('');
    const [bridgeToChain, setBridgeToChain] = useState<string>('');

    const { signedAccountId, signIn } = useWalletSelector()
    const { address: evmAddress } = useAccount();
    const { connect, connectors } = useConnect();
    const { isSolanaConnected, solanaPublicKey, connectSolana } = useWalletContext();

    const { 
        deployToken
    } = useBridge();
    const deploymentProgressTimerRef = useRef<IntervalTimer | null>(null);

    // Update active tab when bridge address changes
    useEffect(() => {
        const newDefaultTab = bridgeAddress && bridgeAddress.length > 0 ? "bridge" : "create";
        setActiveTab(newDefaultTab);
    }, [bridgeAddress]);

    // Check which chains are already deployed
    useEffect(() => {
        if (!bridgeAddress || bridgeAddress.length === 0) {
            setDeploymentOptionsWithStatus(deploymentOptions);
            return;
        }

        const updatedOptions = deploymentOptions.map(option => {
            const chainType = option.name.toLowerCase();
            const isDeployed = bridgeAddress.some(addr => {
                const [chain] = addr.split(':');
                return chain === chainType;
            });

            return {
                ...option,
                isDeployed,
                disabled: option.disabled || isDeployed
            };
        });

        setDeploymentOptionsWithStatus(updatedOptions);
    }, [bridgeAddress]);

    useEffect(() => {
        return () => {
            if (deploymentProgressTimerRef.current) {
                clearInterval(deploymentProgressTimerRef.current);
                deploymentProgressTimerRef.current = null;
            }
        };
    }, []);

    // Track elapsed time during deployment
    useEffect(() => {
        if (showProcessingModal && deploymentStartTime > 0) {
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - deploymentStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                setDeploymentElapsedTime(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);

                // Calculate estimated time remaining based on progress
                if (deploymentProgress > 0 && deploymentProgress < 100) {
                    const totalEstimatedTime = (elapsed / deploymentProgress) * 100;
                    const remaining = Math.ceil(totalEstimatedTime - elapsed);
                    const remainingMinutes = Math.floor(remaining / 60);
                    const remainingSeconds = remaining % 60;
                    setEstimatedTimeRemaining(
                        remainingMinutes > 0
                            ? `~${remainingMinutes}m ${remainingSeconds}s remaining`
                            : `~${remainingSeconds}s remaining`
                    );
                } else if (deploymentProgress >= 100) {
                    setEstimatedTimeRemaining('Completed');
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [showProcessingModal, deploymentStartTime, deploymentProgress]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isCancelled = false;

        const fetchDeploymentEstimates = async () => {
            setEstimatesLoading(true);
            setEstimatesError(null);
            try {
                const transactions = await listTransactions({
                    action: TransactionAction.DEPLOY,
                    status: TransactionStatus.SUCCESS
                });

                if (isCancelled) {
                    return;
                }

                const durationsByChain: Partial<Record<TransactionChain, number[]>> = {};

                transactions.forEach(tx => {
                    if (tx.status !== TransactionStatus.SUCCESS || !tx.createdAt || !tx.updatedAt || !tx.chain) {
                        return;
                    }
                    const createdAt = new Date(tx.createdAt).getTime();
                    const updatedAt = new Date(tx.updatedAt).getTime();
                    if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) {
                        return;
                    }
                    const duration = updatedAt - createdAt;
                    if (duration <= 0) {
                        return;
                    }
                    if (!durationsByChain[tx.chain]) {
                        durationsByChain[tx.chain] = [];
                    }
                    durationsByChain[tx.chain]!.push(duration);
                });

                const stats = Object.entries(durationsByChain).reduce(
                    (acc, [chain, durations]) => {
                        if (!durations || !durations.length) {
                            return acc;
                        }
                        const sorted = [...durations].sort((a, b) => a - b);
                        const averageMs = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
                        const medianMs = sorted[Math.floor(sorted.length / 2)];
                        const p90Ms = getPercentileValue(sorted, 0.9);
                        acc[chain as TransactionChain] = {
                            averageMs,
                            medianMs,
                            p90Ms,
                            sampleSize: sorted.length
                        };
                        return acc;
                    },
                    {} as Partial<Record<TransactionChain, DeploymentEstimateStats>>
                );

                setDeploymentEstimates(stats);
            } catch (error) {
                if (!isCancelled) {
                    console.error('Failed to load deployment estimates', error);
                    setEstimatesError('Unable to load estimated time');
                    setDeploymentEstimates({});
                }
            } finally {
                if (!isCancelled) {
                    setEstimatesLoading(false);
                }
            }
        };

        fetchDeploymentEstimates();

        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!selectedOption) {
            setSelectedEstimateMs(null);
            return;
        }
        const stats = deploymentEstimates[selectedOption.chain];
        if (stats) {
            const preferredEstimate = stats.p90Ms || stats.medianMs || stats.averageMs;
            setSelectedEstimateMs(preferredEstimate ?? null);
        } else {
            setSelectedEstimateMs(null);
        }
    }, [selectedOption, deploymentEstimates]);

    const stopDeploymentProgressTimer = useCallback(() => {
        if (deploymentProgressTimerRef.current) {
            clearInterval(deploymentProgressTimerRef.current);
            deploymentProgressTimerRef.current = null;
        }
    }, []);

    const getEstimateText = useCallback((chain?: TransactionChain) => {
        if (!chain) {
            return '—';
        }
        if (estimatesLoading) {
            return 'Loading...';
        }
        const stats = deploymentEstimates[chain];
        if (stats) {
            const value = stats.p90Ms || stats.medianMs || stats.averageMs;
            return value ? `~${formatDuration(value)}` : 'Calculating...';
        }
        if (estimatesError) {
            return 'Unavailable';
        }
        return 'No historical data yet';
    }, [deploymentEstimates, estimatesError, estimatesLoading]);

    const renderEstimate = useCallback((chain: TransactionChain) => {
        if (estimatesLoading) {
            return (
                <div className="text-right space-y-1">
                    <div className="ml-auto h-2 w-16 rounded bg-gray-200 animate-pulse" />
                    <div className="ml-auto h-2 w-24 rounded bg-gray-100 animate-pulse" />
                </div>
            );
        }
        const stats = deploymentEstimates[chain];
        if (stats) {
            return (
                <div className="text-right space-y-0.5">
                    <div className="text-xs font-medium text-gray-700">
                        {getEstimateText(chain)}
                    </div>
                    <span className="block text-[10px] text-gray-400">
                        {`Based on ${stats.sampleSize} ${stats.sampleSize === 1 ? 'deploy' : 'deploys'}`}
                    </span>
                </div>
            );
        }
        if (estimatesError) {
            return <span className="text-xs text-red-500">Estimate unavailable</span>;
        }
        return <span className="text-xs text-gray-400">No historical data yet</span>;
    }, [deploymentEstimates, estimatesError, estimatesLoading, getEstimateText]);

    const handleOptionSelect = (option: DeploymentOption) => {
        if (option.disabled || option.isDeployed) {
            return; // Don't allow selection of disabled or already deployed options
        }
        setSelectedOption(option);
        setShowReviewModal(true);
        const stats = deploymentEstimates[option.chain];
        if (stats) {
            setSelectedEstimateMs(stats.p90Ms || stats.medianMs || stats.averageMs || null);
        } else {
            setSelectedEstimateMs(null);
        }
    };

    const handleContinue = () => {
        setShowReviewModal(false);
        setShowConfirmModal(true);
    };

    const checkBalance = (
        chain: "sol" | "near" | "eth",
        balance: number,
        minRequired: number
    ) => {
        if (balance < minRequired) {
            toast.error(
                `Insufficient balance to deploy token, balance need >= ${minRequired} ${chain.toUpperCase()}`
            );
            return false;
        }
        return true;
    };

    const handleDeploy = async () => {
        setShowConfirmModal(false);
        setShowProcessingModal(true);
        setDeploymentProgress(0);
        setDeploymentElapsedTime('0s');
        setEstimatedTimeRemaining('Calculating...');
        setDeploymentStartTime(0);
        stopDeploymentProgressTimer();

        if (!isSolanaConnected || !solanaPublicKey) {
            setShowProcessingModal(false);
            setDeploymentStartTime(0);
            setDeploymentProgress(0);
            toast.error('Please connect your Solana wallet first');
            connectSolana();
            return;
        }

        if(selectedOption?.chain === TransactionChain.NEAR){
            if(!signedAccountId){
                setShowProcessingModal(false);
                setDeploymentStartTime(0);
                setDeploymentProgress(0);
                toast.error('Please connect your NEAR wallet first');
                signIn();
                return;
            }
        }

        if(selectedOption?.chain === TransactionChain.ETHEREUM){
            if(!evmAddress){
                setShowProcessingModal(false);
                setDeploymentStartTime(0);
                setDeploymentProgress(0);
                toast.error('Please connect your EVM wallet first');
                try {
                    await connect({ connector: connectors.length >= 2 ? connectors[1] : connectors[0] });
                } catch (error) {
                    console.error('Failed to connect EVM wallet:', error);
                }
                return;
            }
        }

        let transactionId: string | null = null;
        const deploymentStart = Date.now();
        setDeploymentStartTime(deploymentStart);

        try {
            // Get user address
            const userAddress = solanaPublicKey;

            // Create pending transaction before starting deployment
            const transactionPayload = {
                userAddress,
                txHash: '', // Will be updated later when we have the actual tx hash
                action: TransactionAction.DEPLOY,
                baseToken: token?.mintAddress,
                quoteToken: '', // Not applicable for deploy
                amountIn: 0, // Not applicable for deploy
                amountOut: 0, // Not applicable for deploy
                pricePerToken: 0, // Not applicable for deploy
                slippageBps: 0,
                fee: 0,
                feeToken: 'SOL',
                status: TransactionStatus.PENDING,
                chain: TransactionChain.SOLANA,
                poolAddress: '', // Not applicable for deploy
            };

            const createdTransaction = await createTransaction(transactionPayload);
            transactionId = createdTransaction.id;

            // Step 1: Starting deployment process (10%)
            setDeploymentProgress(10);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 1.5: Check if token is already deployed (20%)
            setDeploymentProgress(20);
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const chainToken = ChainKind.Sol;

            const bridgedAddresses = await getAllBridgeTokens(token?.mintAddress, chainToken, network);

            if (bridgedAddresses && bridgedAddresses.length > 0) {
                const targetChain = selectedOption?.name.toLowerCase();
                const alreadyDeployed = bridgedAddresses.some(addr => {
                    const [chain] = addr.split(':');
                    return chain === targetChain;
                });

                if (alreadyDeployed) {
                    // Token already deployed - show success immediately
                    setDeploymentProgress(100);
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Update transaction status to success
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    }

                    setShowProcessingModal(false);
                    setShowSuccessModal(true);
                    toast.success('Token already deployed and ready for bridging!');
                    return;
                }
            }

            // Step 2: Check balances (30%)
            setDeploymentProgress(30);
            const solBalance = await getSolBalance(solanaPublicKey || '');

            if (!checkBalance("sol", Number(solBalance), MIN_BALANCE.sol)) {
                // Update transaction to failed
                if (transactionId) {
                    await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                }
                setShowProcessingModal(false);
                return;
            }

            const nearBalance = await getNearBalance(signedAccountId || '');

            if (!checkBalance("near", Number(nearBalance), MIN_TARGET_BALANCE.near)) {
                // Update transaction to failed
                if (transactionId) {
                    await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                }
                setShowProcessingModal(false);
                return;
            }

            // Step 3: Deploying token (60%)
            setDeploymentProgress(60);
            const estimatedDurationMs = selectedEstimateMs ?? FALLBACK_DEPLOYMENT_ESTIMATE_MS;
            if (estimatedDurationMs) {
                setEstimatedTimeRemaining(`~${formatDuration(estimatedDurationMs)}`);
                const waitStart = Date.now();
                stopDeploymentProgressTimer();
                deploymentProgressTimerRef.current = setInterval(() => {
                    setDeploymentProgress(prev => {
                        if (prev >= 95) {
                            return prev;
                        }
                        const elapsed = Date.now() - waitStart;
                        const normalized = estimatedDurationMs > 0 ? elapsed / estimatedDurationMs : 0;
                        const projected = 60 + Math.floor(Math.min(0.999, Math.max(0, normalized)) * 30);
                        const nextValue = Math.min(95, projected);
                        return nextValue > prev ? nextValue : prev;
                    });
                }, 1000);
            }
            const txDeployToken = await deployToken(network, ChainKind.Sol, ChainKind.Near, token?.mintAddress);

            // Step 4: Finalizing deployment (100%)
            stopDeploymentProgressTimer();
            setDeploymentProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update transaction status to success
            if (transactionId) {
                await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS, txDeployToken.result?.toString());
            }

            setShowProcessingModal(false);
            setShowSuccessModal(true);
            toast.success('Deploy token successfully');

        } catch (error: any) {
            stopDeploymentProgressTimer();
            console.error("Deploy token error:", error);

            // Check if error is due to token already being deployed
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('already been processed') || errorMessage.includes('already deployed')) {
                // Treat as success - token is already deployed
                setDeploymentProgress(100);
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update transaction status to success
                if (transactionId) {
                    try {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    } catch (updateError) {
                        console.error('Error updating transaction status:', updateError);
                    }
                }

                setShowProcessingModal(false);
                setShowSuccessModal(true);
                toast.success('Token already deployed and ready for bridging!');
            } else {
                // Update transaction status to failed
                if (transactionId) {
                    try {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    } catch (updateError) {
                        console.error('Error updating transaction status:', updateError);
                    }
                }

                const rawDeployError = extractErrorMessage(error);
                const friendlyDeployError = getFriendlyErrorMessage(rawDeployError, 'deploy');
                toast.error('Deploy token failed', {
                    description: friendlyDeployError
                });
                setShowProcessingModal(false);
                setDeploymentProgress(0);
                setDeploymentStartTime(0);
                setEstimatedTimeRemaining('Calculating...');
                setDeploymentElapsedTime('0s');
            }
        }
    };

    const handleCancel = () => {
        stopDeploymentProgressTimer();
        setShowReviewModal(false);
        setShowConfirmModal(false);
        setShowProcessingModal(false);
        setShowSuccessModal(false);
        setSelectedOption(null);
        setSelectedEstimateMs(null);
        setDeploymentProgress(0);
        setDeploymentStartTime(0);
        setDeploymentElapsedTime('0s');
        setEstimatedTimeRemaining('Calculating...');
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

    const handleBridgeProcessingComplete = (transactionHash: string) => {
        setBridgeTransactionHash(transactionHash);
        setShowBridgeProcessingModal(false);
        setShowBridgeSuccessModal(true);
    };

    const handleBridgeError = (message?: string) => {
        setShowBridgeProcessingModal(false);
        setBridgeTransactionHash('');
        setBridgeTransactionHashNear('');
        setBridgeProgress(0);
        const friendlyMessage = getFriendlyErrorMessage(message || 'Unknown error', 'bridge');
        toast.error('Bridge token failed', {
            description: friendlyMessage
        });
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
    
    const solanaChain = token?.mintAddress ? {
        name: "SOLANA",
        logo: "/chains/solana-dark.svg",
        address: token.mintAddress,
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
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg max-h-[95vh] overflow-y-hidde [&>button]:hidden border-none">
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
                            <BridgeTokensComponent
                                token={token}
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
                                        <div className="shrink-0">
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
                                {deploymentOptionsWithStatus.map((option, index) => (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex items-center justify-between p-2 px-3 border rounded-lg transition-colors ${
                                                    option.disabled || option.isDeployed
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
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`font-semibold text-sm ${
                                                                option.disabled || option.isDeployed ? 'text-gray-500' : 'text-gray-900'
                                                            }`}>
                                                                {option.name}
                                                            </h3>
                                                            {option.isDeployed && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] rounded-full font-medium">
                                                                    Deployed
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs ${
                                                            option.disabled || option.isDeployed ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {option.description}
                                                        </p>
                                                        <p className={`text-xs font-extralight ${
                                                            option.disabled || option.isDeployed ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                            Available DEXes: {option.availableDexes}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right space-y-1">
                                                    <div className={`text-sm font-medium ${
                                                        option.disabled || option.isDeployed ? 'text-gray-500' : 'text-gray-900'
                                                    }`}>
                                                        {option.cost}
                                                    </div>
                                                    {!option.disabled && !option.isDeployed ? renderEstimate(option.chain) : (
                                                        option.isDeployed ? (
                                                            <span className="text-xs text-gray-400">Already deployed</span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Coming soon</span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        {option.isDeployed && (
                                            <TooltipContent className="bg-white border border-gray-100">
                                                <p>This chain has already been deployed</p>
                                            </TooltipContent>
                                        )}
                                        {option.disabled && !option.isDeployed && (
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
                                <button
                                    onClick={onClose}
                                    className="px-6 text-gray-700 hover:border-red-400 hover:text-red-500 cursor-pointer border border-gray-300 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        )
                    }
                </DialogContent>
            </Dialog>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Create {token?.symbol} on {selectedOption?.name} for Bridging
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
                            <span className="text-sm text-gray-600">Estimated Duration:</span>
                            <span className="text-sm font-medium">
                                {selectedOption ? getEstimateText(selectedOption.chain) : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Contract Type:</span>
                            <span className="text-sm font-medium">ERC-20 Compatible</span>
                        </div>
                    </Card>

                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <strong>Note:</strong> Deployment time varies based on network conditions. Actual time will be displayed during deployment.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 text-gray-700 hover:border-red-400 hover:text-red-500 cursor-pointer border border-gray-300 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleContinue}
                            className="px-6 bg-red-500 text-white hover:bg-red-400 cursor-pointer border border-red-400 py-2 rounded-lg"
                        >
                            Continue
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Deploy Modal */}
            <Dialog open={showConfirmModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
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
                            <span className="text-sm text-gray-600">Estimated Duration:</span>
                            <span className="text-sm font-medium">
                                {selectedOption ? getEstimateText(selectedOption.chain) : '—'}
                            </span>
                        </div>
                    </Card>

                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <strong>Note:</strong> Deployment time varies based on network conditions. You'll see real-time progress during deployment.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 text-gray-700 hover:border-red-400 hover:text-red-500 cursor-pointer border border-gray-300 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeploy}
                            className="px-6 bg-red-500 text-white hover:bg-red-400 cursor-pointer border border-red-400 py-2 rounded-lg"
                        >
                            Deploy Token
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Processing Modal */}
            <Dialog open={showProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {token?.symbol} to {selectedOption?.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Track deployment progress
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <img src={selectedOption?.logo} alt={selectedOption?.name} className="h-12 w-12" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Deploying {token?.symbol}
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

                        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Elapsed</span>
                                <span className="text-xs font-semibold text-gray-700">{deploymentElapsedTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estimated Remaining</span>
                                <span className="text-xs font-semibold text-gray-700">
                                    {deploymentProgress > 0 && deploymentProgress < 100
                                        ? estimatedTimeRemaining
                                        : (selectedEstimateMs
                                            ? `~${formatDuration(selectedEstimateMs)}`
                                            : (selectedOption ? getEstimateText(selectedOption.chain) : 'Calculating...'))}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                            Please don't close this window. {selectedEstimateMs
                                && selectedEstimateMs > 0 && `Current estimate: ~${formatDuration(selectedEstimateMs)}.`}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={handleCancel}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {token?.symbol} to {selectedOption?.name}
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
                                {token?.symbol} is now available on {selectedOption?.name}
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
                                    <span className="text-sm text-gray-700">Users can now bridge tokens between {token.symbol} and {selectedOption?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-gray-600"/>
                                    <span className="text-sm text-gray-700">Create liquidity pools on Uniswap V3 or Sushiswap</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleBridgeNow}
                            className="px-6 text-gray-700 hover:border-red-400 hover:text-red-500 cursor-pointer border border-gray-300 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBridgeNow}
                            className="px-6 bg-red-500 text-white hover:bg-red-400 cursor-pointer border border-red-400 py-2 rounded-lg"
                        >
                            Bridge Now
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bridge Processing Modal */}
            <Dialog open={showBridgeProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {token?.symbol} from {bridgeFromChain} to {bridgeToChain}
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
                            Bridging {formatNumberWithCommas(bridgeAmount)} {token?.symbol}
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
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {token?.symbol} from {bridgeFromChain} to {bridgeToChain}
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
                                {formatNumberWithCommas(bridgeAmount)} {token?.symbol} has been bridged from {bridgeFromChain} to {bridgeToChain}
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
                        <button
                            onClick={handleBridgeSuccessClose}
                            className="px-6 bg-red-500 text-white hover:bg-red-400 cursor-pointer border border-red-400 py-2 rounded-lg"
                        >
                            Continue
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 