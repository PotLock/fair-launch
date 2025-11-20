"use client"

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check } from "lucide-react";
import { SelectTokenModal } from "@/components/modal/SelectTokenModal";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { SOL_NETWORK } from "@/configs/env.config";
import { getNearBalance } from "@/lib/near";
import { getSolBalance } from "@/lib/sol";
import { formatNumberInput, parseFormattedNumber } from "@/utils";
import { getAllBridgeTokens } from "@/lib/omni-bridge";
import { ChainKind, normalizeAmount } from "omni-bridge-sdk";
import { useBridge } from "@/hooks/useBridge";
import { useAccount, useConnect } from "wagmi";
import { useWalletContext } from "@/contexts/WalletProviderContext";
import { Token, ChainType, TransactionAction, TransactionStatus, TransactionChain } from "@/types/bridge.types";
import { MIN_BALANCE, MIN_TARGET_BALANCE } from "@/constants/bridge.constants";
import { useChainTokens } from "@/hooks/useChainTokens";
import { TransactionHistory } from "./TransactionHistory";
import { ChainSection } from "./ChainSection";
import { TokenInput } from "./TokenInput";
import { BridgeInfoCard } from "./BridgeInfoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { createTransaction, updateTransactionStatus } from "@/lib/api";
import { useTransactionBridge } from "@/hooks/useSWR";


type ModalState = {
    showBridgeProcessing: boolean;
    showBridgeSuccess: boolean;
    showDeployProcessing: boolean;
    showDeploySuccess: boolean;
    bridgeProgress: number;
    deployProgress: number;
};

type ModalAction =
    | { type: 'SHOW_BRIDGE_PROCESSING'; progress?: number }
    | { type: 'SHOW_BRIDGE_SUCCESS' }
    | { type: 'SHOW_DEPLOY_PROCESSING'; progress?: number }
    | { type: 'SHOW_DEPLOY_SUCCESS' }
    | { type: 'UPDATE_BRIDGE_PROGRESS'; progress: number }
    | { type: 'UPDATE_DEPLOY_PROGRESS'; progress: number }
    | { type: 'CLOSE_ALL' }
    | { type: 'CLOSE_BRIDGE_SUCCESS' }
    | { type: 'CLOSE_DEPLOY_SUCCESS' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'SHOW_BRIDGE_PROCESSING':
            return { ...state, showBridgeProcessing: true, bridgeProgress: action.progress || 0 };
        case 'SHOW_BRIDGE_SUCCESS':
            return { ...state, showBridgeProcessing: false, showBridgeSuccess: true, bridgeProgress: 100 };
        case 'SHOW_DEPLOY_PROCESSING':
            return { ...state, showDeployProcessing: true, deployProgress: action.progress || 0 };
        case 'SHOW_DEPLOY_SUCCESS':
            return { ...state, showDeployProcessing: false, showDeploySuccess: true, deployProgress: 100 };
        case 'UPDATE_BRIDGE_PROGRESS':
            return { ...state, bridgeProgress: action.progress };
        case 'UPDATE_DEPLOY_PROGRESS':
            return { ...state, deployProgress: action.progress };
        case 'CLOSE_ALL':
            return {
                showBridgeProcessing: false,
                showBridgeSuccess: false,
                showDeployProcessing: false,
                showDeploySuccess: false,
                bridgeProgress: 0,
                deployProgress: 0,
            };
        case 'CLOSE_BRIDGE_SUCCESS':
            return { ...state, showBridgeSuccess: false };
        case 'CLOSE_DEPLOY_SUCCESS':
            return { ...state, showDeploySuccess: false };
        default:
            return state;
    }
};

export default function BridgeToken() {
    const { signedAccountId, signIn } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { address: ethereumAddress } = useAccount();
    const { connect, connectors } = useConnect();
    const { connectSolana } = useWalletContext();

    const { deployToken, transferToken } = useBridge();
    const { getTokensForChain, getLoadingStateForChain } = useChainTokens();

    const [modalState, dispatchModal] = useReducer(modalReducer, {
        showBridgeProcessing: false,
        showBridgeSuccess: false,
        showDeployProcessing: false,
        showDeploySuccess: false,
        bridgeProgress: 0,
        deployProgress: 0,
    });

    const [amount, setAmount] = useState<string>('');
    const [isBridging, setIsBridging] = useState(false);
    const [isTokenDeployedOnTargetChain, setIsTokenDeployedOnTargetChain] = useState(false);

    const [fromChain, setFromChain] = useState<ChainType>('solana');
    const [toChain, setToChain] = useState<ChainType>('near');

    const [selectedToken, setSelectedToken] = useState<Token>();
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenModalType, setTokenModalType] = useState<'from' | 'to'>('from');

    const userAddress = useMemo(() => 
        publicKey?.toBase58() || signedAccountId || ethereumAddress?.toString(),
        [publicKey, signedAccountId, ethereumAddress]
    );
    
    const { transactions } = useTransactionBridge(userAddress);

    const connectedWallets = useMemo((): ChainType[] => {
        const connectedChains: ChainType[] = [];
        if (connected && publicKey) {
            connectedChains.push('solana');
        }
        if (signedAccountId) {
            connectedChains.push('near');
        }
        if (ethereumAddress) {
            connectedChains.push('ethereum');
        }
        return connectedChains;
    }, [connected, publicKey, signedAccountId, ethereumAddress]);

    useEffect(() => {
        if (connectedWallets.length > 0) {
            if (connectedWallets.length === 1) {
                setFromChain(connectedWallets[0]);
            } else if (connectedWallets.length === 2) {
                if (connectedWallets.includes('solana')) {
                    setFromChain('solana');
                    const otherChain = connectedWallets.find(c => c !== 'solana');
                    if (otherChain) {
                        setToChain(otherChain);
                    }
                } else {
                    setFromChain(connectedWallets[0]);
                    setToChain(connectedWallets[1]);
                }
            } else if (connectedWallets.length === 3) {
                setFromChain('solana');
                setToChain('near');
            }
        }
    }, [connectedWallets]);

    const isFromChainWalletConnected = useMemo(() => {
        switch (fromChain) {
            case 'near':
                return !!signedAccountId;
            case 'solana':
                return connected && !!publicKey;
            case 'ethereum':
                return !!ethereumAddress;
            default:
                return false;
        }
    }, [fromChain, signedAccountId, connected, publicKey, ethereumAddress]);

    const isAmountExceedingBalance = useMemo(() => {
        if (!selectedToken || !amount) return false;
        const inputAmount = parseFormattedNumber(amount);
        const tokenBalance = parseFloat(selectedToken.balance);
        return inputAmount > tokenBalance;
    }, [selectedToken, amount]);

    const availableTokens = useMemo(() => {
        if (!isFromChainWalletConnected) {
            return [];
        }
        return getTokensForChain(fromChain);
    }, [isFromChainWalletConnected, fromChain, getTokensForChain]);

    const isLoadingFromChainTokens = useMemo(() => {
        return getLoadingStateForChain(fromChain);
    }, [fromChain, getLoadingStateForChain]);

    const getWalletAddress = useCallback((chain: ChainType): string | undefined => {
        switch (chain) {
            case 'solana':
                return publicKey?.toBase58();
            case 'near':
                return signedAccountId || undefined;
            case 'ethereum':
                return ethereumAddress ? ethereumAddress.toString() : undefined;
            default:
                return undefined;
        }
    }, [publicKey, signedAccountId, ethereumAddress]);

    useEffect(() => {
        if (availableTokens.length > 0) {
            setSelectedToken(availableTokens[0]);
        } else {
            setSelectedToken(undefined);
        }
        setIsTokenDeployedOnTargetChain(false);
    }, [availableTokens.length, fromChain]);

    useEffect(() => {
        if (isFromChainWalletConnected) {
            if (availableTokens.length > 0 && !selectedToken) {
                setSelectedToken(availableTokens[0]);
            }
        }
    }, [availableTokens.length, selectedToken, isFromChainWalletConnected]);

    const fetchBridgeTokens = useCallback(async () => {
        if (selectedToken) {
            const chainToken = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const addressTokenBridged = await getAllBridgeTokens(selectedToken.mint, chainToken, 'testnet')

            if (addressTokenBridged && addressTokenBridged.length > 0) {
                const targetChainAddress = addressTokenBridged.find(addr => {
                    const [chain] = addr.split(':');
                    return chain === toChain;
                });

                setIsTokenDeployedOnTargetChain(!!targetChainAddress);
            } else {
                setIsTokenDeployedOnTargetChain(false);
            }
        }
    }, [selectedToken, toChain])

    useEffect(() => {
        fetchBridgeTokens()
    }, [fetchBridgeTokens])

    useEffect(() => {
        setIsTokenDeployedOnTargetChain(false);
        if (selectedToken) {
            fetchBridgeTokens();
        }
    }, [toChain, fromChain]);

    const handleMaxAmount = useCallback(() => {
        if (selectedToken) {
            const formattedBalance = formatNumberInput(selectedToken.balance);
            setAmount(formattedBalance);
        }
    }, [selectedToken]);

    const handleHalfAmount = useCallback(() => {
        if (selectedToken) {
            const currentAmount = parseFloat(selectedToken.balance) || 0;
            const halfAmount = (currentAmount * 0.5).toFixed(6);
            const formattedHalfAmount = formatNumberInput(halfAmount);
            setAmount(formattedHalfAmount);
        }
    }, [selectedToken]);

    const checkBalance = useCallback((
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
    }, []);

    const handleBridge = useCallback(async () => {
        if (!amount || parseFormattedNumber(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected) {
            toast.error(`Please connect your ${fromChain.toUpperCase()} wallet first`);
            if (fromChain === 'solana') {
                connectSolana();
            } else if (fromChain === 'near') {
                signIn();
            } else if (fromChain === 'ethereum') {
                try {
                    await connect({ connector: connectors.length >= 2 ? connectors[1] : connectors[0] });
                } catch (error) {
                    console.error('Failed to connect EVM wallet:', error);
                }
            }
            return;
        }

        if (isAmountExceedingBalance) {
            toast.error('Amount exceeds token balance');
            return;
        }

        setIsBridging(true);
        dispatchModal({ type: 'SHOW_BRIDGE_PROCESSING', progress: 0 });

        let transactionId: string | null = null;

        try {
            // Get user address
            const userAddress = getWalletAddress(fromChain);
            if (!userAddress) {
                toast.error('Wallet address not found');
                dispatchModal({ type: 'CLOSE_ALL' });
                setIsBridging(false);
                return;
            }
            const amountValue = parseFormattedNumber(amount);

            // Create pending transaction before starting bridge
            const transactionPayload = {
                userAddress,
                txHash: '', // Will be updated later when we have the actual tx hash
                action: TransactionAction.BRIDGE,
                baseToken: selectedToken.mint,
                quoteToken: selectedToken.mint, // For bridge, we use the same token
                amountIn: amountValue,
                amountOut: amountValue, // 1:1 for bridge
                pricePerToken: 1, // 1:1 for bridge
                slippageBps: 0,
                fee: 0,
                feeToken: fromChain === 'solana' ? 'SOL' : fromChain === 'near' ? 'NEAR' : 'ETH',
                status: TransactionStatus.PENDING,
                chain: fromChain === 'solana' ? TransactionChain.SOLANA : fromChain === 'near' ? TransactionChain.NEAR : TransactionChain.ETHEREUM,
                poolAddress: '', // Not applicable for bridge
            };

            const createdTransaction = await createTransaction(transactionPayload);
            transactionId = createdTransaction.id;

            // Step 1: Preparing bridge transaction (20%)
            dispatchModal({ type: 'UPDATE_BRIDGE_PROGRESS', progress: 20 });
            await new Promise(resolve => setTimeout(resolve, 500));

            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const amountBigInt = BigInt(parseFormattedNumber(amount)*Math.pow(10, selectedToken.decimals));
            const decimalsToChain = fromChain == "near" ? 24 : selectedToken.decimals;
            const amountToBridge = normalizeAmount(amountBigInt, selectedToken.decimals, decimalsToChain);

            // Step 2: Initiating transfer (50% - 95%)
            dispatchModal({ type: 'UPDATE_BRIDGE_PROGRESS', progress: 50 });

            // Start progress animation during bridge based on estimated VAA fetch time (~80s)
            const estimatedBridgeDurationMs = 80000; // VAA fetch typically takes ~80 seconds
            const bridgeWaitStart = Date.now();
            const bridgeProgressInterval = setInterval(() => {
                const elapsed = Date.now() - bridgeWaitStart;
                const normalized = estimatedBridgeDurationMs > 0 ? elapsed / estimatedBridgeDurationMs : 0;
                const projected = 50 + Math.floor(Math.min(0.999, Math.max(0, normalized)) * 45); // 50% to 95%
                const nextValue = Math.min(95, projected);
                dispatchModal({ type: 'UPDATE_BRIDGE_PROGRESS', progress: nextValue });
            }, 1000);

            const from = fromChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const to = toChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const senderAddress = fromChain === 'near' ? signedAccountId : publicKey?.toString();
            const recipientAddress = toChain === 'near' ? signedAccountId : publicKey?.toString();

            let result;
            try {
                result = await transferToken(
                    network,
                    from,
                    to,
                    senderAddress!,
                    selectedToken.mint,
                    amountToBridge,
                    recipientAddress!
                );

                // Clear interval and complete progress
                clearInterval(bridgeProgressInterval);

                // Step 3: Finalizing bridge (100%)
                dispatchModal({ type: 'UPDATE_BRIDGE_PROGRESS', progress: 100 });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (bridgeError) {
                clearInterval(bridgeProgressInterval);
                throw bridgeError;
            }

            console.log("result", result);

            // Update transaction status to success
            if (transactionId) {
                await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS, result);
            }
            setAmount('')

            dispatchModal({ type: 'SHOW_BRIDGE_SUCCESS' });
            toast.success('Bridge completed successfully');
        } catch (error) {
            console.error('Bridge error:', error);
            toast.error('Bridge failed. Please try again.');

            // Update transaction status to failed
            if (transactionId) {
                try {
                    await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                } catch (updateError) {
                    console.error('Error updating transaction status:', updateError);
                }
            }

            dispatchModal({ type: 'CLOSE_ALL' });
        } finally {
            setIsBridging(false);
        }
    }, [amount, selectedToken, isFromChainWalletConnected, isAmountExceedingBalance, fromChain, toChain, getWalletAddress, connectSolana, signIn, connect, connectors, transferToken, signedAccountId, publicKey]);

    const handleDeployToken = useCallback(async () => {
        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }
        console.log("tochain",toChain)

        if (!isFromChainWalletConnected) {
            toast.error(`Please connect your ${fromChain.toUpperCase()} wallet first`);
            if (fromChain === 'solana') {
                connectSolana();
            } else if (fromChain === 'near') {
                signIn();
            } else if (fromChain === 'ethereum') {
                try {
                    await connect({ connector: connectors.length >= 2 ? connectors[1] : connectors[0] });
                } catch (error) {
                    console.error('Failed to connect EVM wallet:', error);
                }
            }
            return;
        }

        dispatchModal({ type: 'SHOW_DEPLOY_PROCESSING', progress: 0 });

        let transactionId: string | null = null;

        try {
            // Get user address
            const userAddress = publicKey?.toBase58();

            // Create pending transaction before starting deployment
            const transactionPayload = {
                userAddress: userAddress || '',
                txHash: '', // Will be updated later when we have the actual tx hash
                action: TransactionAction.DEPLOY,
                baseToken: selectedToken.mint,
                quoteToken: '', // Not applicable for deploy
                amountIn: 0, // Not applicable for deploy
                amountOut: 0, // Not applicable for deploy
                pricePerToken: 0, // Not applicable for deploy
                slippageBps: 0,
                fee: 0,
                feeToken: fromChain === 'solana' ? 'SOL' : fromChain === 'near' ? 'NEAR' : 'ETH',
                status: TransactionStatus.PENDING,
                chain: fromChain === 'solana' ? TransactionChain.SOLANA : fromChain === 'near' ? TransactionChain.NEAR : TransactionChain.ETHEREUM,
                poolAddress: '', // Not applicable for deploy
            };

            const createdTransaction = await createTransaction(transactionPayload);
            transactionId = createdTransaction.id;

            // Step 1: Starting deployment (10%)
            dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 10 });
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 1.5: Check if token is already deployed (20%)
            dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 20 });
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const chainToken = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;

            const bridgedAddresses = await getAllBridgeTokens(selectedToken.mint, chainToken, network);

            if (bridgedAddresses && bridgedAddresses.length > 0) {
                const alreadyDeployed = bridgedAddresses.some(addr => {
                    const [chain] = addr.split(':');
                    return chain === toChain;
                });

                if (alreadyDeployed) {
                    // Token already deployed - show success immediately
                    dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 100 });
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Update transaction status to success
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    }

                    dispatchModal({ type: 'SHOW_DEPLOY_SUCCESS' });
                    setIsTokenDeployedOnTargetChain(true);
                    toast.success('Token already deployed and ready for bridging!');
                    return;
                }
            }

            // Step 2: Checking balances (30%)
            dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 30 });
            const solBalance = await getSolBalance(publicKey?.toBase58() || '')
            const nearBalance = await getNearBalance(signedAccountId || '')

            if (fromChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_BALANCE.sol)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    dispatchModal({ type: 'CLOSE_ALL' });
                    return;
                }
            } else if (fromChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_BALANCE.near)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    dispatchModal({ type: 'CLOSE_ALL' });
                    return;
                }
            }

            if (toChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_TARGET_BALANCE.near)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    dispatchModal({ type: 'CLOSE_ALL' });
                    return;
                }
            } else if (toChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_TARGET_BALANCE.sol)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    dispatchModal({ type: 'CLOSE_ALL' });
                    return;
                }
            }

            // Step 3: Deploying token (60% - 95%)
            dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 60 });

            // Start progress animation during deployment
            let currentProgress = 60;
            const progressInterval = setInterval(() => {
                if (currentProgress < 95) {
                    currentProgress += 1;
                    dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: currentProgress });
                }
            }, 200);

            const from = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const to = toChain === 'solana' ? ChainKind.Sol : ChainKind.Near;

            try {
                const txDeployToken = await deployToken(network, from, to, selectedToken.mint);

                // Clear interval and complete progress
                clearInterval(progressInterval);

                // Step 4: Finalizing deployment (100%)
                dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 100 });
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update transaction status to success
                if (transactionId) {
                    await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS, txDeployToken.result?.toString());
                }
                setAmount('')
                dispatchModal({ type: 'SHOW_DEPLOY_SUCCESS' });
                setIsTokenDeployedOnTargetChain(true);
                toast.success('Deploy token successfully');

            } catch (deployError) {
                clearInterval(progressInterval);
                throw deployError;
            }

        } catch (error: any) {
            console.error("Deploy token error:", error);

            // Check if error is due to token already being deployed
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('already been processed') || errorMessage.includes('already deployed')) {
                dispatchModal({ type: 'UPDATE_DEPLOY_PROGRESS', progress: 100 });
                await new Promise(resolve => setTimeout(resolve, 500));

                if (transactionId) {
                    try {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    } catch (updateError) {
                        console.error('Error updating transaction status:', updateError);
                    }
                }

                dispatchModal({ type: 'SHOW_DEPLOY_SUCCESS' });
                setIsTokenDeployedOnTargetChain(true);
                toast.success('Token already deployed and ready for bridging!');
            } else {
                if (transactionId) {
                    try {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    } catch (updateError) {
                        console.error('Error updating transaction status:', updateError);
                    }
                }

                toast.error('Deploy token failed. Please try again.');
                dispatchModal({ type: 'CLOSE_ALL' });
            }
        } 
    }, [selectedToken, toChain, isFromChainWalletConnected, fromChain, connectSolana, signIn, connect, connectors, publicKey, signedAccountId, checkBalance, deployToken, fetchBridgeTokens]);

    const handleSwapChains = useCallback(() => {
        const currentFromChain = fromChain;
        const currentToChain = toChain;
        setFromChain(currentToChain);
        setToChain(currentFromChain);
    }, [fromChain, toChain]);


    const handleToChainChange = useCallback((chain: ChainType) => {
        if (chain === fromChain) {
            toast.error('Bridge only works for cross-chain transfers. Please select a different destination chain.');
            return;
        }
        setToChain(chain);
    }, [fromChain]);

    const handleFromChainChange = useCallback((chain: ChainType) => {
        if (chain === toChain) {
            const availableChains: ChainType[] = ['solana', 'near', 'ethereum'].filter(c => c !== chain) as ChainType[];
            setToChain(availableChains[0]);
        }
        setFromChain(chain);
    }, [toChain]);


    const bridgeButtonText = useMemo(() => {
        if (isBridging) return `Bridging... ${modalState.bridgeProgress}%`;
        if (isTokenDeployedOnTargetChain) return `Bridge ${selectedToken?.symbol || ''}`;
        return `Deploy ${selectedToken?.symbol || ''} on ${toChain.toUpperCase()}`;
    }, [isBridging, modalState.bridgeProgress, isTokenDeployedOnTargetChain, selectedToken, toChain]);

    return (
        <div className="min-h-screen py-4 md:py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bridge Tokens</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-2">Transfer tokens across different blockchain networks</p>
                </div>

                <div className="flex flex-col-reverse lg:flex-row gap-4 md:gap-6">
                    <TransactionHistory transactions={transactions} />

                    <div className="w-full lg:w-[478px] lg:shrink-0">
                        <Card className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-none">
                            <div className="flex flex-col">
                                {/* From Section */}
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-base font-medium text-gray-600">From</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <ChainSection
                                            chain={fromChain}
                                            onChainChange={handleFromChainChange}
                                            walletAddress={getWalletAddress(fromChain)}
                                            label="Select source chain"
                                            disabledChains={["ethereum"]}
                                            disabledTooltips={{ ethereum: "Coming soon" }}
                                        />

                                        <TokenInput
                                            amount={amount}
                                            onAmountChange={setAmount}
                                            selectedToken={selectedToken}
                                            onTokenSelectClick={() => {
                                                setTokenModalType('from');
                                                setIsTokenModalOpen(true);
                                            }}
                                            onHalfAmount={handleHalfAmount}
                                            onMaxAmount={handleMaxAmount}
                                            chain={fromChain}
                                            isLoading={isLoadingFromChainTokens}
                                            isDisabled={!isFromChainWalletConnected || isBridging}
                                        />
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center cursor-pointer">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-8 h-8 rounded-full bg-gray-100 border-gray-200 hover:bg-red-500 cursor-pointer"
                                        onClick={handleSwapChains}
                                    >
                                        <ArrowUpDown className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* To Section */}
                                <div className="space-y-2 -mt-2">
                                    <h3 className="text-base font-medium text-gray-600">To</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <ChainSection
                                            chain={toChain}
                                            onChainChange={handleToChainChange}
                                            walletAddress={getWalletAddress(toChain)}
                                            label="Select destination chain"
                                            disabledChains={["ethereum", fromChain]}
                                            disabledTooltips={{
                                                ethereum: "Coming soon",
                                                [fromChain]: "Cannot bridge to same chain"
                                            }}
                                        />

                                        <TokenInput
                                            amount={amount}
                                            onAmountChange={setAmount}
                                            selectedToken={selectedToken}
                                            onTokenSelectClick={() => { }}
                                            onHalfAmount={handleHalfAmount}
                                            onMaxAmount={handleMaxAmount}
                                            chain={toChain}
                                            isLoading={isLoadingFromChainTokens}
                                            isDisabled={true}
                                            isReadOnly={true}
                                            sourceChain={fromChain}
                                        />
                                    </div>
                                </div>

                                <BridgeInfoCard fromChain={fromChain} toChain={toChain} />

                                <div className="flex items-start gap-2 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-orange-700">
                                        Bridge only supports cross-chain transfers. Token swaps on the same chain are not available.
                                    </p>
                                </div>

                                <div className="mt-5">
                                    <Button
                                        onClick={isTokenDeployedOnTargetChain ? handleBridge : handleDeployToken}
                                        disabled={isBridging || !selectedToken || !isFromChainWalletConnected}
                                        className="w-full bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:bg-red-400 disabled:text-white disabled:cursor-not-allowed"
                                    >
                                        {bridgeButtonText}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <SelectTokenModal
                open={isTokenModalOpen}
                onOpenChange={setIsTokenModalOpen}
                tokens={availableTokens}
                isLoadingTokens={isLoadingFromChainTokens}
                onTokenSelect={setSelectedToken}
                selectedToken={selectedToken}
                modalType={tokenModalType}
            />

            {/* Bridge Processing Modal */}
            <Dialog open={modalState.showBridgeProcessing} onOpenChange={() => {}}>
                <DialogContent className="w-[90%] max-w-[500px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {selectedToken?.symbol} from {fromChain} to {toChain}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Transferring your tokens across chains
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={fromChain === 'solana' ? '/chains/solana-dark.svg' : fromChain === 'near' ? '/chains/near-dark.svg' : '/chains/ethereum.svg'}
                                    alt={fromChain}
                                    className="h-12 w-12"
                                />
                                <div className="text-2xl">→</div>
                                <img
                                    src={toChain === 'solana' ? '/chains/solana-dark.svg' : toChain === 'near' ? '/chains/near-dark.svg' : '/chains/ethereum.svg'}
                                    alt={toChain}
                                    className="h-12 w-12"
                                />
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Bridging {amount} {selectedToken?.symbol}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Transferring from {fromChain.toUpperCase()} to {toChain.toUpperCase()}
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${modalState.bridgeProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {modalState.bridgeProgress}% complete
                        </p>

                        <p className="text-sm text-gray-500">
                            Please don't close this window while the bridge is in progress.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bridge Success Modal */}
            <Dialog open={modalState.showBridgeSuccess} onOpenChange={() => dispatchModal({ type: 'CLOSE_BRIDGE_SUCCESS' })}>
                <DialogContent className="w-[90%] max-w-[500px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Bridge {selectedToken?.symbol} from {fromChain} to {toChain}
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
                                {amount} {selectedToken?.symbol} has been bridged from {fromChain.toUpperCase()} to {toChain.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={() => dispatchModal({ type: 'CLOSE_BRIDGE_SUCCESS' })}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deploy Processing Modal */}
            <Dialog open={modalState.showDeployProcessing} onOpenChange={() => {}}>
                <DialogContent className="w-[90%] max-w-[500px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {selectedToken?.symbol} to {toChain}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Creating your token on the target chain
                        </p>
                    </DialogHeader>

                    <div className="mt-6 text-center">
                        <div className="flex justify-center mb-4">
                            <img
                                src={toChain === 'solana' ? '/chains/solana-dark.svg' : toChain === 'near' ? '/chains/near-dark.svg' : '/chains/ethereum.svg'}
                                alt={toChain}
                                className="h-12 w-12"
                            />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Deploying {selectedToken?.symbol}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Creating your token on {toChain.toUpperCase()}
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${modalState.deployProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {modalState.deployProgress}% complete
                        </p>

                        <p className="text-sm text-gray-500">
                            Please don't close this window while the deployment is in progress.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deploy Success Modal */}
            <Dialog open={modalState.showDeploySuccess} onOpenChange={() => dispatchModal({ type: 'CLOSE_DEPLOY_SUCCESS' })}>
                <DialogContent className="w-[90%] max-w-[500px] rounded-lg [&>button]:hidden border-none">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Deploy {selectedToken?.symbol} to {toChain}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                            Deployment completed successfully
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
                                {selectedToken?.symbol} is now available on {toChain.toUpperCase()}
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 text-start rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-red-600 mb-3">What's Next?</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-600"/>
                                    <span className="text-sm text-gray-700">Bridge Contract Ready</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-gray-600"/>
                                    <span className="text-sm text-gray-700">You can now bridge tokens between chains</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={() => {
                                dispatchModal({ type: 'CLOSE_DEPLOY_SUCCESS' });
                                fetchBridgeTokens();
                            }}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            Start Bridging
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
