"use client"

import { useState, useEffect, useCallback } from "react";
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
import { useAccount } from "wagmi";
import { Token, ChainType, TransactionAction, TransactionStatus, TransactionChain } from "@/types/bridge.types";
import { MIN_BALANCE, MIN_TARGET_BALANCE } from "@/constants/bridge.constants";
import { useChainTokens } from "@/hooks/useChainTokens";
import { TransactionHistory } from "./TransactionHistory";
import { ChainSection } from "./ChainSection";
import { TokenInput } from "./TokenInput";
import { BridgeInfoCard } from "./BridgeInfoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTransaction, updateTransactionStatus } from "@/lib/api";
import { useTransactionBridge } from "@/hooks/useSWR";

export default function BridgeToken() {
    const { signedAccountId } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { address: ethereumAddress } = useAccount();

    const { deployToken, transferToken } = useBridge();
    const { getTokensForChain, getLoadingStateForChain } = useChainTokens();

    const [amount, setAmount] = useState<string>('');
    const [isBridging, setIsBridging] = useState(false);
    const [bridgeProgress, setBridgeProgress] = useState(0);
    const [isTokenDeployedOnTargetChain, setIsTokenDeployedOnTargetChain] = useState(false);

    const [fromChain, setFromChain] = useState<ChainType>('solana');
    const [toChain, setToChain] = useState<ChainType>('near');

    const [selectedToken, setSelectedToken] = useState<Token>();
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenModalType, setTokenModalType] = useState<'from' | 'to'>('from');

    // Loading modal states
    const [showBridgeProcessingModal, setShowBridgeProcessingModal] = useState(false);
    const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
    const [showDeployProcessingModal, setShowDeployProcessingModal] = useState(false);
    const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);
    const [deployProgress, setDeployProgress] = useState(0);


    const userAddress = publicKey?.toBase58() || signedAccountId || ethereumAddress?.toString();
    const { transactions, isLoading: isLoadingTransactions, error: transactionsError } = useTransactionBridge(userAddress);

    const getConnectedWallets = (): ChainType[] => {
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
    };

    useEffect(() => {
        const connectedWallets = getConnectedWallets();
        
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
    }, [connected, publicKey, signedAccountId, ethereumAddress]);

    // Helper functions
    const isFromChainWalletConnected = () => {
        switch (fromChain) {
            case 'near':
                return !!signedAccountId;
            case 'solana':
                return connected && publicKey;
            case 'ethereum':
                return !!ethereumAddress;
            default:
                return false;
        }
    };

    const isAmountExceedingBalance = () => {
        if (!selectedToken || !amount) return false;
        const inputAmount = parseFormattedNumber(amount);
        const tokenBalance = parseFloat(selectedToken.balance);
        return inputAmount > tokenBalance;
    };

    const getAvailableTokens = () => {
        if (!isFromChainWalletConnected()) {
            return [];
        }
        return getTokensForChain(fromChain);
    };

    const getIsLoadingFromChainTokens = () => {
        return getLoadingStateForChain(fromChain);
    };

    const getWalletAddress = (chain: ChainType): string | undefined => {
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
    };

    // Update selected token when chain changes or wallet connection status changes
    useEffect(() => {
        const availableTokens = getAvailableTokens();
        if (availableTokens.length > 0) {
            setSelectedToken(availableTokens[0]);
        } else {
            setSelectedToken(undefined);
        }
        setIsTokenDeployedOnTargetChain(false);
    }, [fromChain, connected, signedAccountId, ethereumAddress]);

    // Update selected token when tokens change
    useEffect(() => {
        if (isFromChainWalletConnected()) {
            const availableTokens = getAvailableTokens();
            if (availableTokens.length > 0 && !selectedToken) {
                setSelectedToken(availableTokens[0]);
            }
        }
    }, [getTokensForChain(fromChain).length, selectedToken]);

    const fetchBridgeTokens = useCallback(async () => {
        if (selectedToken) {
            const chainToken = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const addressTokenBridged = await getAllBridgeTokens(selectedToken.mint, chainToken, 'testnet')
            console.log("addressTokenBridged", addressTokenBridged)
            console.log("chainToken", chainToken)
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

    const handleMaxAmount = () => {
        if (selectedToken) {
            const formattedBalance = formatNumberInput(selectedToken.balance);
            setAmount(formattedBalance);
        }
    };

    const handleHalfAmount = () => {
        if (selectedToken) {
            const currentAmount = parseFloat(selectedToken.balance) || 0;
            const halfAmount = (currentAmount * 0.5).toFixed(6);
            const formattedHalfAmount = formatNumberInput(halfAmount);
            setAmount(formattedHalfAmount);
        }
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

    const handleBridge = async () => {
        if(!publicKey){
            toast.error("Please connect wallet Solana")
            return
        }

        if (!amount || parseFormattedNumber(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected()) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (isAmountExceedingBalance()) {
            toast.error('Amount exceeds token balance');
            return;
        }

        setIsBridging(true);
        setShowBridgeProcessingModal(true);
        setBridgeProgress(0);

        let transactionId: string | null = null;

        try {
            // Get user address
            const userAddress = publicKey.toBase58();
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
            setBridgeProgress(20);
            await new Promise(resolve => setTimeout(resolve, 500));

            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
            const amountBigInt = BigInt(parseFormattedNumber(amount)*Math.pow(10, selectedToken.decimals));
            const decimalsToChain = fromChain == "near" ? 24 : selectedToken.decimals;
            const amountToBridge = normalizeAmount(amountBigInt, selectedToken.decimals, decimalsToChain);

            // Step 2: Initiating transfer (50%)
            setBridgeProgress(50);

            const from = fromChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const to = toChain === 'near' ? ChainKind.Near : ChainKind.Sol;
            const senderAddress = fromChain === 'near' ? signedAccountId : publicKey?.toString();
            const recipientAddress = toChain === 'near' ? signedAccountId : publicKey?.toString();

            const result = await transferToken(
                network,
                from,
                to,
                senderAddress!,
                selectedToken.mint,
                amountToBridge,
                recipientAddress!
            );

            // Step 3: Finalizing bridge (100%)
            setBridgeProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log("result", result);

            // Update transaction status to success
            if (transactionId) {
                await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS, result);
            }
            setAmount('')

            setShowBridgeProcessingModal(false);
            setShowBridgeSuccessModal(true);
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

            setShowBridgeProcessingModal(false);
        } finally {
            setIsBridging(false);
        }
    };

    const handleDeployToken = async () => {
        if(!publicKey){
            toast.error("Please connect wallet Solana")
            return
        }

        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected()) {
            toast.error('Please connect your wallet first');
            return;
        }

        setShowDeployProcessingModal(true);
        setDeployProgress(0);

        let transactionId: string | null = null;

        try {
            // Get user address
            const userAddress = publicKey.toBase58();

            // Create pending transaction before starting deployment
            const transactionPayload = {
                userAddress,
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
                chain: toChain === 'solana' ? TransactionChain.SOLANA : toChain === 'near' ? TransactionChain.NEAR : TransactionChain.ETHEREUM,
                poolAddress: '', // Not applicable for deploy
            };

            const createdTransaction = await createTransaction(transactionPayload);
            transactionId = createdTransaction.id;

            // Step 1: Starting deployment (10%)
            setDeployProgress(10);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 1.5: Check if token is already deployed (20%)
            setDeployProgress(20);
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
                    setDeployProgress(100);
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Update transaction status to success
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    }

                    setShowDeployProcessingModal(false);
                    setShowDeploySuccessModal(true);
                    setIsTokenDeployedOnTargetChain(true);
                    toast.success('Token already deployed and ready for bridging!');
                    return;
                }
            }

            // Step 2: Checking balances (30%)
            setDeployProgress(30);
            const solBalance = await getSolBalance(publicKey?.toBase58() || '')
            const nearBalance = await getNearBalance(signedAccountId || '')

            if (fromChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_BALANCE.sol)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    setShowDeployProcessingModal(false);
                    return;
                }
            } else if (fromChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_BALANCE.near)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    setShowDeployProcessingModal(false);
                    return;
                }
            }

            if (toChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_TARGET_BALANCE.near)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    setShowDeployProcessingModal(false);
                    return;
                }
            } else if (toChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_TARGET_BALANCE.sol)) {
                    // Update transaction to failed
                    if (transactionId) {
                        await updateTransactionStatus(transactionId, TransactionStatus.FAILED);
                    }
                    setShowDeployProcessingModal(false);
                    return;
                }
            }

            // Step 3: Deploying token (60%)
            setDeployProgress(60);
            const from = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const to = toChain === 'solana' ? ChainKind.Sol : ChainKind.Near;

            const txDeployToken = await deployToken(network, from, to, selectedToken.mint);

            // Step 4: Finalizing deployment (100%)
            setDeployProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update transaction status to success
            if (transactionId) {
                await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS, txDeployToken.result?.toString());
            }
            setAmount('')
            setShowDeployProcessingModal(false);
            setShowDeploySuccessModal(true);
            setIsTokenDeployedOnTargetChain(true);
            toast.success('Deploy token successfully');

        } catch (error: any) {
            console.error("Deploy token error:", error);

            // Check if error is due to token already being deployed
            const errorMessage = error?.message || error?.toString() || '';
            if (errorMessage.includes('already been processed') || errorMessage.includes('already deployed')) {
                // Treat as success - token is already deployed
                setDeployProgress(100);
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update transaction status to success
                if (transactionId) {
                    try {
                        await updateTransactionStatus(transactionId, TransactionStatus.SUCCESS);
                    } catch (updateError) {
                        console.error('Error updating transaction status:', updateError);
                    }
                }

                setShowDeployProcessingModal(false);
                setShowDeploySuccessModal(true);
                setIsTokenDeployedOnTargetChain(true);
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

                toast.error('Deploy token failed. Please try again.');
                setShowDeployProcessingModal(false);
            }
        } 
    }

    const handleSwapChains = () => {
        const currentFromChain = fromChain;
        const currentToChain = toChain;
        setFromChain(currentToChain);
        setToChain(currentFromChain);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bridge Tokens</h1>
                    <p className="text-gray-600 mt-2">Transfer tokens across different blockchain networks</p>
                </div>

                <div className="flex gap-6">
                    <TransactionHistory transactions={transactions} />

                    <div className="w-[478px]">
                        <Card className="bg-white border border-gray-200 rounded-xl p-5 shadow-none">
                            <div className="flex flex-col">
                                {/* From Section */}
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-base font-medium text-gray-600">From</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <ChainSection
                                            chain={fromChain}
                                            onChainChange={setFromChain}
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
                                            isLoading={getIsLoadingFromChainTokens()}
                                            isDisabled={!isFromChainWalletConnected() || isBridging}
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
                                            onChainChange={setToChain}
                                            walletAddress={getWalletAddress(toChain)}
                                            label="Select destination chain"
                                            disabledChains={["ethereum"]}
                                            disabledTooltips={{ ethereum: "Coming soon" }}
                                        />

                                        <TokenInput
                                            amount={amount}
                                            onAmountChange={setAmount}
                                            selectedToken={selectedToken}
                                            onTokenSelectClick={() => { }}
                                            onHalfAmount={handleHalfAmount}
                                            onMaxAmount={handleMaxAmount}
                                            chain={toChain}
                                            isLoading={getIsLoadingFromChainTokens()}
                                            isDisabled={true}
                                            isReadOnly={true}
                                        />
                                    </div>
                                </div>

                                <BridgeInfoCard />

                                <div className="mt-5">
                                    <Button
                                        onClick={isTokenDeployedOnTargetChain ? handleBridge : handleDeployToken}
                                        disabled={isBridging || !selectedToken || !isFromChainWalletConnected()}
                                        className="w-full bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:bg-red-400 disabled:text-white disabled:cursor-not-allowed"
                                    >
                                        {isBridging ? `Bridging... ${bridgeProgress}%` :
                                            isTokenDeployedOnTargetChain ? `Bridge ${selectedToken?.symbol || ''}` :
                                                `Deploy ${selectedToken?.symbol || ''} on ${toChain.toUpperCase()}`}
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
                tokens={getAvailableTokens()}
                isLoadingTokens={getIsLoadingFromChainTokens()}
                onTokenSelect={setSelectedToken}
                selectedToken={selectedToken}
                modalType={tokenModalType}
            />

            {/* Bridge Processing Modal */}
            <Dialog open={showBridgeProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
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
            <Dialog open={showBridgeSuccessModal} onOpenChange={() => setShowBridgeSuccessModal(false)}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
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
                            onClick={() => setShowBridgeSuccessModal(false)}
                            className="px-6 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deploy Processing Modal */}
            <Dialog open={showDeployProcessingModal} onOpenChange={() => {}}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
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
                                style={{ width: `${deployProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {deployProgress}% complete
                        </p>

                        <p className="text-sm text-gray-500">
                            Please don't close this window. Deployment typically takes 2-5 minutes.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deploy Success Modal */}
            <Dialog open={showDeploySuccessModal} onOpenChange={() => setShowDeploySuccessModal(false)}>
                <DialogContent className="md:max-w-[500px] max-w-[360px] rounded-lg [&>button]:hidden border-none">
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
                                setShowDeploySuccessModal(false);
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
