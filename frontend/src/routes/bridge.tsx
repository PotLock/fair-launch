import { createFileRoute } from "@tanstack/react-router";
import { useMetadata } from "../hook/useMetadata";
import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronDown, ArrowUpDown, RefreshCw, ExternalLink, Check, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/dropdown-menu";
import { SelectTokenModal } from "../components/SelectTokenModal";
import { TokenSelectSkeleton } from "../components/ui/token-select-skeleton";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { NEAR_NETWORK, SOL_NETWORK } from "../configs/env.config";
import { formatBalanceNear, getAllTokenOnNear, getNearBalance } from "../lib/near";
import { getAllTokens as getSolanaTokens, getSolBalance } from "../lib/sol";
import { getAllTokens as getEthereumTokens, getBalanceEVM } from "../lib/evm";
import { truncateAddress, formatNumberInput, parseFormattedNumber, formatNumberToCurrency } from "../utils";
import { getAllBridgeTokens } from "../lib/omni-bridge";
import { ChainKind, normalizeAmount } from "omni-bridge-sdk";
import { useBridge } from "../hook/useBridge";
import { useAccount } from "wagmi";


interface Transaction {
    id: string;
    date: string;
    status: 'pending' | 'completed' | 'failed';
    fromChain: string;
    toChain: string;
    amount: string;
    coin: string;
    txHash?: string;
    txHashNear?: string;
}

interface Token {
    symbol: string;
    balance: string;
    value: string;
    icon: string;
    decimals: number;
    mint: string;
    selected?: boolean;
}

type ChainType = 'solana' | 'near' | 'ethereum';

export const Route = createFileRoute("/bridge")({
    component: Bridge,
});

function Bridge() {
    // Metadata for bridge page
    useMetadata({
        title: "Bridge Tokens - POTLAUNCH",
        description: "Bridge your tokens across multiple chains with POTLAUNCH. Seamlessly transfer tokens between Solana, NEAR, and other supported networks.",
        imageUrl: "/og-image.png"
    });

    // Wallet hooks
    const { signedAccountId } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { address: ethereumAddress } = useAccount();

    const { deployToken, transferToken } = useBridge();

    // Bridge state
    const [amount, setAmount] = useState<string>('0');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isBridging, setIsBridging] = useState(false);
    const [bridgeProgress, setBridgeProgress] = useState(0);
    const [isTokenDeployedOnTargetChain, setIsTokenDeployedOnTargetChain] = useState(false);

    // Chain selection state
    const [fromChain, setFromChain] = useState<ChainType>('solana');
    const [toChain, setToChain] = useState<ChainType>('near');

    // Token state
    const [selectedToken, setSelectedToken] = useState<Token>();
    const [solanaTokens, setSolanaTokens] = useState<Token[]>([]);
    const [nearTokens, setNearTokens] = useState<Token[]>([]);
    const [ethereumTokens, setEthereumTokens] = useState<Token[]>([]);
    const [isLoadingSolanaTokens, setIsLoadingSolanaTokens] = useState(false);
    const [isLoadingNearTokens, setIsLoadingNearTokens] = useState(false);
    const [isLoadingEthereumTokens, setIsLoadingEthereumTokens] = useState(false);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenModalType, setTokenModalType] = useState<'from' | 'to'>('from');
    // Chain information
    const chains = {
        near: { 
            name: 'NEAR', 
            icon: '/chains/near-dark.svg', 
            color: 'bg-green-500',
            explorerUrl: NEAR_NETWORK == 'testnet' 
                ? "https://testnet.nearblocks.io"
                : "https://nearblocks.io"
        },
        solana: { 
            name: 'Solana', 
            icon: '/chains/solana-dark.svg', 
            color: 'bg-purple-500',
            explorerUrl: "https://solscan.io"
        },
        ethereum: { 
            name: 'Ethereum', 
            icon: '/chains/ethereum.svg', 
            color: 'bg-blue-500',
            explorerUrl: "https://etherscan.io"
        }
    };
    const availableChains: ChainType[] = ['near', 'solana', 'ethereum'];

    // Function to fetch Solana tokens
    const fetchSolanaTokens = async () => {
        if (!connected || !publicKey) return;
        
        setIsLoadingSolanaTokens(true);
        try {
            const tokens = await getSolanaTokens(publicKey.toString());
            const formattedTokens: Token[] = tokens.map(token => ({
                symbol: token.symbol,
                balance: token.balance.toString(),
                value: '0', // TODO: Add price fetching
                icon: token.image || '/chains/solana.svg',
                decimals: token.decimals,
                mint: token.mint
            }));
            
            setSolanaTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching Solana tokens:', error);
        } finally {
            setIsLoadingSolanaTokens(false);
        }
    };

    // Function to fetch NEAR tokens
    const fetchNearTokens = async () => {
        if (!signedAccountId) return;
        
        setIsLoadingNearTokens(true);
        try {
            const tokens = await getAllTokenOnNear(signedAccountId);
            const formattedTokens: Token[] = tokens.map((token: any, index: number) => ({
                symbol: token.ft_meta?.symbol || `${index}`,
                balance: formatBalanceNear(token.amount) || '0',
                value: '0', // TODO: Add price fetching
                icon: token.ft_meta?.icon || '/icons/default-token.svg',
                decimals: token.ft_meta?.decimals || 24,
                mint: token.contract
            }));
            
            setNearTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching NEAR tokens:', error);
        } finally {
            setIsLoadingNearTokens(false);
        }
    };

    // Function to fetch Ethereum tokens
    const fetchEthereumTokens = async () => {
        if (!ethereumAddress) return;
        
        setIsLoadingEthereumTokens(true);
        try {
            const tokens = await getEthereumTokens(ethereumAddress);
            const formattedTokens: Token[] = tokens.map(token => ({
                symbol: token.symbol,
                balance: token.balance,
                value: '0', // TODO: Add price fetching
                icon: token.logo || '/chains/ethereum.svg',
                decimals: token.decimals,
                mint: token.address
            }));
            
            setEthereumTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching Ethereum tokens:', error);
            toast.error('Failed to fetch Ethereum tokens');
        } finally {
            setIsLoadingEthereumTokens(false);
        }
    };

    // Available tokens for each chain
    const chainTokens = {
        near: nearTokens,
        solana: solanaTokens,
        ethereum: ethereumTokens
    };

    // Check if wallet is connected for the selected "from" chain
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

    // Check if amount exceeds token balance
    const isAmountExceedingBalance = () => {
        if (!selectedToken || !amount) return false;
        const inputAmount = parseFormattedNumber(amount);
        const tokenBalance = parseFloat(selectedToken.balance);
        return inputAmount > tokenBalance;
    };

    // Get available tokens for the selected "from" chain
    const getAvailableTokens = () => {
        if (!isFromChainWalletConnected()) {
            return [];
        }
        return chainTokens[fromChain] || [];
    };

    // Get loading state for the selected "from" chain
    const getIsLoadingFromChainTokens = () => {
        switch (fromChain) {
            case 'solana':
                return isLoadingSolanaTokens;
            case 'near':
                return isLoadingNearTokens;
            case 'ethereum':
                return isLoadingEthereumTokens;
            default:
                return false;
        }
    };



    // Get wallet connection status text
    const getWalletConnectionText = () => {
        if (!isFromChainWalletConnected()) {
            switch (fromChain) {
                case 'near':
                    return 'Connect NEAR Wallet';
                case 'solana':
                    return 'Connect Solana Wallet';
                case 'ethereum':
                    return 'Connect Ethereum Wallet';
                default:
                    return 'Connect wallet';
            }
        }
        
        if (getAvailableTokens().length === 0) {
            return 'No tokens found';
        }
        
        return 'Select Token';
    };

    // Fetch Solana tokens when wallet connects
    useEffect(() => {
        if (connected && publicKey) {
            fetchSolanaTokens();
        } else {
            setSolanaTokens([]);
        }
    }, [connected, publicKey?.toString()]);

    // Fetch NEAR tokens when wallet connects
    useEffect(() => {
        if (signedAccountId) {
            fetchNearTokens();
        } else {
            setNearTokens([]);
        }
    }, [signedAccountId]);

    // Fetch Ethereum tokens when wallet connects
    useEffect(() => {
        if (ethereumAddress) {
            fetchEthereumTokens();
        } else {
            setEthereumTokens([]);
        }
    }, [ethereumAddress]);


    // Update selected token when chain changes or wallet connection status changes
    useEffect(() => {
        const availableTokens = getAvailableTokens();
        if (availableTokens.length > 0) {
            setSelectedToken(availableTokens[0]);
        } else {
            setSelectedToken(undefined);
        }
        // Reset deployment status when token changes
        setIsTokenDeployedOnTargetChain(false);
    }, [fromChain, connected, signedAccountId, ethereumAddress]);

    // Update selected token when tokens change (but avoid infinite loop)
    useEffect(() => {
        if (isFromChainWalletConnected()) {
            const availableTokens = getAvailableTokens();
            if (availableTokens.length > 0 && !selectedToken) {
                setSelectedToken(availableTokens[0]);
            }
        }
    }, [solanaTokens.length, nearTokens.length, ethereumTokens.length, selectedToken]);

    const fetchBridgeTokens = useCallback(async()=>{
        if(selectedToken){
            const chainToken = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const addressTokenBridged = await getAllBridgeTokens(selectedToken.mint,chainToken,'testnet')
            
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
    },[selectedToken, toChain])

    useEffect(()=>{
        fetchBridgeTokens()
    },[fetchBridgeTokens])

    // Reset token deployment status when toChain changes
    useEffect(() => {
        setIsTokenDeployedOnTargetChain(false);
        if (selectedToken) {
            fetchBridgeTokens();
        }
    }, [toChain,fromChain]);

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

    const MIN_BALANCE = {
        sol: 0.0001,
        near: 0.0001,
        eth: 0.001,
    };

    const MIN_TARGET_BALANCE = {
        sol: 0.0001,
        near: 3,
        eth: 0.001,
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

        try {
            const amountBigInt = BigInt(parseFormattedNumber(amount));
            const decimalsToChain = fromChain == "near" ? 24 : selectedToken.decimals;
            const normalizeedAmount = normalizeAmount(amountBigInt, selectedToken.decimals, decimalsToChain);
            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet";
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
                normalizeedAmount, 
                recipientAddress!
            );
            console.log("result", result)
        } catch (error) {
            console.error('Bridge error:', error);
            toast.error('Bridge failed. Please try again.');
            setIsBridging(false);
        }finally{
            setIsBridging(false)
        }
    };

    const handleDeployToken = async () => {
        console.log("deploy token")
        if (!selectedToken) {
            toast.error('Please select a token');
            return;
        }

        if (!isFromChainWalletConnected()) {
            toast.error('Please connect your wallet first');
            return;
        }
        try{
            const solBalance = await getSolBalance(publicKey?.toBase58() || '')
            const nearBalance = await getNearBalance(signedAccountId || '')
            const ethBalance = await getBalanceEVM(ethereumAddress || '')
            
            if (fromChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_BALANCE.sol)) return;
            } else if (fromChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_BALANCE.near)) return;
            } else if (fromChain === "ethereum") {
                if (!checkBalance("eth", Number(ethBalance), MIN_BALANCE.eth)) return;
            }

            if (toChain === "near") {
                if (!checkBalance("near", Number(nearBalance), MIN_TARGET_BALANCE.near)) return;
            } else if (toChain === "solana") {
                if (!checkBalance("sol", Number(solBalance), MIN_TARGET_BALANCE.sol)) return;
            } else if (toChain === "ethereum") {
                if (!checkBalance("eth", Number(ethBalance), MIN_TARGET_BALANCE.eth)) return;
            }

            const network = SOL_NETWORK == "devnet" ? "testnet" : "mainnet"
            const from = fromChain === 'solana' ? ChainKind.Sol : ChainKind.Near;
            const to = toChain === 'solana' ? ChainKind.Sol : ChainKind.Near;

            await deployToken(network,from,to,selectedToken.mint);
            toast.success('Deploy token successfully');

        }catch(error){
            console.error("Deploy token error:", error);
            toast.error('Deploy token failed. Please try again.');
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'failed': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'pending': return '⏳';
            case 'failed': return '❌';
            default: return '•';
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bridge Tokens</h1>
                    <p className="text-gray-600 mt-2">Transfer tokens across different blockchain networks</p>
                </div>

                <div className="flex gap-6">
                    {/* Transaction History Section */}
                    <div className="flex-1">
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-none">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-8">
                                        <span className="text-xs font-medium text-gray-900">DATE & TIME</span>
                                        <div className="flex gap-8">
                                            <span className="text-xs font-medium text-gray-900">STATUS</span>
                                            <span className="text-xs font-medium text-gray-900">COIN</span>
                                            <span className="text-xs font-medium text-gray-900">AMOUNT</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-900">ACTIONS</span>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                {transactions.length === 0 ? (
                                    <div className="text-center">
                                        <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                            <img src="/icons/empty.svg" alt="empty" className="w-full h-full" />
                                        </div>
                                        <p className="text-gray-500 text-lg">No transaction found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                                                <div className="flex gap-8">
                                                    <span className="text-sm text-gray-600">{tx.date}</span>
                                                    <div className="flex gap-8">
                                                        <span className={`text-sm font-medium ${getStatusColor(tx.status)} flex items-center gap-1`}>
                                                            {getStatusIcon(tx.status)} {tx.status.toUpperCase()}
                                                        </span>
                                                        <span className="text-sm text-gray-600">{tx.coin}</span>
                                                        <span className="text-sm text-gray-600">{tx.amount}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {tx.txHash && (
                                                        <a 
                                                            href={`${chains[toChain as ChainType].explorerUrl}/tx/${tx.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <Button variant="outline" size="sm">
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Bridge Form Section */}
                    <div className="w-[478px]">
                        <Card className="bg-white border border-gray-200 rounded-xl p-5 shadow-none">
                            <div className="flex flex-col">
                                {/* From Section */}
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-base font-medium text-gray-600">From</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="hover:bg-gray-100 p-2 cursor-pointer rounded-lg" role="button" tabIndex={0} aria-label="Select source chain">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                                                <img 
                                                                    src={chains[fromChain].icon} 
                                                                    alt={chains[fromChain].name}
                                                                    className="w-full h-full rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium">{chains[fromChain].name}</span>
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-44 bg-white">
                                                    {availableChains.map((c) => (
                                                        <DropdownMenuItem key={c} onSelect={(e) => { e.preventDefault(); setFromChain(c); }} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                                                            <div className="w-4 h-4 rounded-full flex items-center justify-center">
                                                                <img src={chains[c].icon} alt={chains[c].name} className="w-full h-full rounded-full" />
                                                            </div>
                                                            <span className="text-sm">{chains[c].name}</span>
                                                            {fromChain === c && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <a 
                                                href={fromChain === 'solana' 
                                                    ? `${chains[fromChain].explorerUrl}/account/${publicKey?.toBase58()}${SOL_NETWORK=="devnet"&&"?cluster=devnet"}`
                                                    : fromChain === 'near'
                                                    ? `${chains[fromChain].explorerUrl}/address/${signedAccountId}`
                                                    : `${chains[fromChain].explorerUrl}/address/${ethereumAddress}`
                                                } 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs hover:underline"
                                            >
                                                {fromChain === 'solana' && publicKey?.toBase58() && truncateAddress(publicKey.toBase58())}
                                                {fromChain === 'near' && signedAccountId && truncateAddress(signedAccountId)}
                                                {fromChain === 'ethereum' && ethereumAddress && truncateAddress(ethereumAddress)}
                                            </a>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={amount}
                                                onChange={(e) => {
                                                    const formattedValue = formatNumberInput(e.target.value);
                                                    setAmount(formattedValue);
                                                }}
                                                className="text-2xl font-semibold border-none outline-none bg-transparent w-64"
                                                placeholder="0"
                                                disabled={isBridging}
                                            />
                                            <Button 
                                                variant="outline" 
                                                className="bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                onClick={() => {
                                                    setTokenModalType('from');
                                                    setIsTokenModalOpen(true);
                                                }}
                                                disabled={!isFromChainWalletConnected() || getIsLoadingFromChainTokens()}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {getIsLoadingFromChainTokens() ? (
                                                        <TokenSelectSkeleton />
                                                    ) : (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center relative">
                                                                <img 
                                                                    src={selectedToken?.icon || '/icons/default-token.svg'} 
                                                                    alt={selectedToken?.symbol || 'Select token'}
                                                                    className="w-full h-full rounded-full"
                                                                />

                                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center">
                                                                    <img 
                                                                        src={chains[fromChain].icon} 
                                                                        alt={chains[fromChain].name}
                                                                        className="w-full h-full rounded-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {selectedToken?.symbol || (!getIsLoadingFromChainTokens() && getWalletConnectionText())}
                                                            </span>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </div>
                                            </Button>
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-sm text-gray-500">$ --</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{formatNumberToCurrency(Number(selectedToken?.balance))}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-5 px-3 text-xs"
                                                    onClick={handleHalfAmount}
                                                    disabled={isBridging || !selectedToken}
                                                >
                                                    50%
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-5 px-3 text-xs"
                                                    onClick={handleMaxAmount}
                                                    disabled={isBridging || !selectedToken}
                                                >
                                                    Max
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center cursor-pointer">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-8 h-8 rounded-full bg-gray-100 border-gray-200"
                                        onClick={() => {
                                            // Store current values
                                            const currentFromChain = fromChain;
                                            const currentToChain = toChain;
                                            
                                            // Swap chains directly without validation
                                            setFromChain(currentToChain);
                                            setToChain(currentFromChain);
                                        }}
                                    >
                                        <ArrowUpDown className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2 -mt-2">
                                    <h3 className="text-base font-medium text-gray-600">To</h3>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="hover:bg-gray-100 p-2 cursor-pointer rounded-lg" role="button" tabIndex={0} aria-label="Select destination chain">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                                                <img 
                                                                    src={chains[toChain].icon} 
                                                                    alt={chains[toChain].name}
                                                                    className="w-full h-full rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium">{chains[toChain].name}</span>
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-44 bg-white">
                                                    {availableChains.map((c) => (
                                                        <DropdownMenuItem key={c} onSelect={(e) => { e.preventDefault(); setToChain(c); }} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                                                            <div className="w-4 h-4 rounded-full flex items-center justify-center">
                                                                <img src={chains[c].icon} alt={chains[c].name} className="w-full h-full rounded-full" />
                                                            </div>
                                                            <span className="text-sm">{chains[c].name}</span>
                                                            {toChain === c && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <a 
                                                href={toChain === 'solana' 
                                                    ? `${chains[toChain].explorerUrl}/account/${publicKey?.toBase58()}${SOL_NETWORK=="devnet"&&"?cluster=devnet"}`
                                                    : toChain === 'near'
                                                    ? `${chains[toChain].explorerUrl}/address/${signedAccountId}`
                                                    : `${chains[toChain].explorerUrl}/address/${ethereumAddress}`
                                                } 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs hover:underline"
                                            >
                                                {toChain === 'solana' && publicKey?.toBase58() && truncateAddress(publicKey.toBase58())}
                                                {toChain === 'near' && signedAccountId && truncateAddress(signedAccountId)}
                                                {toChain === 'ethereum' && ethereumAddress && truncateAddress(ethereumAddress)}
                                            </a>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={amount}
                                                readOnly
                                                className="text-2xl font-semibold border-none outline-none bg-transparent w-64 text-gray-400"
                                                placeholder="0.00"
                                            />
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    {getIsLoadingFromChainTokens() ? (
                                                        <TokenSelectSkeleton />
                                                    ) : (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center relative">
                                                                <img 
                                                                    src={selectedToken?.icon || '/icons/default-token.svg'} 
                                                                    alt={selectedToken?.symbol || 'Select token'}
                                                                    className="w-full h-full rounded-full"
                                                                />

                                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center">
                                                                    <img 
                                                                        src={chains[toChain].icon} 
                                                                        alt={chains[toChain].name}
                                                                        className="w-full h-full rounded-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {selectedToken?.symbol || (!getIsLoadingFromChainTokens() && 'Select token')}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-sm text-gray-500">$ --</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{formatNumberToCurrency(Number(selectedToken?.balance))}</span>
                                                <Button size="sm" variant="outline" className="h-5 px-3 text-xs" disabled>
                                                    Max
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-5 px-3 text-xs" disabled>
                                                    50%
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Card className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-none mt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-600">Rate</span>
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 text-gray-600" />
                                                <span className="text-xs font-medium text-gray-600">1 SOL = 0.0157 NEAR</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-600">Estimated Processing Time</span>
                                            <span className="text-xs font-medium text-gray-600">~17s</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-600">Platform Fee</span>
                                            <span className="text-xs font-medium text-gray-600">0.25%</span>
                                        </div>
                                    </div>
                                </Card>

                                <div className="mt-5">
                                    <Button
                                        onClick={isTokenDeployedOnTargetChain ? handleBridge : handleDeployToken}
                                        disabled={isBridging ||  !selectedToken || !isFromChainWalletConnected()}
                                        className="w-full bg-red-500 text-white hover:bg-red-400 disabled:bg-red-400 disabled:text-white disabled:cursor-not-allowed"
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
        </div>
    );
}