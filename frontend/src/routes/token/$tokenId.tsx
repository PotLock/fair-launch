import { createFileRoute, useParams } from "@tanstack/react-router";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';
import { Globe, ChevronDown, Download, Plus, ExternalLink, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "../../components/ui/dropdown-menu";
import { useCallback, useState,useEffect } from "react";
import { BondingCurveTokenInfo, getAllocationsAndVesting, getBondingCurveAccounts, getCurveConfig, getTokenHoldersByMint, TokenInfo } from "../../utils/tokenUtils";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { copyToClipboard, formatNumberWithCommas, truncateAddress,formatNumberToCurrency } from "../../utils";
import { TokenDetailSkeleton } from "../../components/TokenDetailSkeleton";
import { useTokenTrading } from "../../hook/useTokenTrading";
import { PublicKey } from "@solana/web3.js";
import { Button } from "../../components/ui/button";
import { getTokenByMint } from "../../lib/api";
import { linearBuyCost, linearSellCost, calculateLinearCurrentPrice } from "../../utils/sol";
import { TokenDistributionItem, Holders} from "../../types"
import { Progress } from "../../components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../components/ui/tooltip";
import { formatVestingInfo, mergeVestingData } from "../../utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { LaunchStatus } from "../../components/LaunchStatus";
import { LaunchConditions } from "../../components/LaunchConditions";
import { LiquidityPools } from "../../components/LiquidityPools";
import { BondingCurveChart } from "../../components/BondingCurveChart";

export const Route = createFileRoute("/token/$tokenId")({
    component: TokenDetail,
});

const COLORS = ['#00A478', '#8B5CF6', '#3B82F6', '#059669', '#DC2626', '#2563EB'];

function TokenDetail() {
    const {tokenId} = useParams({from: "/token/$tokenId"})
    const anchorWallet = useAnchorWallet();
    const [selectedPayment, setSelectedPayment] = useState<{ name: string; icon: string } | null>(null);
    const [selectedReceive, setSelectedReceive] = useState<{ name: string; icon: string } | null>(null);
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [bondingCurveInfo, setBondingCurveInfo] = useState<BondingCurveTokenInfo | null>(null);
    const [payAmount, setPayAmount] = useState("");
    const [receiveAmount, setReceiveAmount] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const { publicKey } = useWallet();
    const { buyToken, sellToken } = useTokenTrading();
    const isLoggedIn = !!publicKey;
    const [isBuying, setIsBuying] = useState(false);
    const [holders, setHolders] = useState<Holders[]>([]);
    const [curveConfig, setCurveConfig] = useState<any>(null)
    const [allocationsAndVesting, setAllocationsAndVesting] = useState<any[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number>(0);

    const loadInfoToken = useCallback(async () => {
        try {
            setLoading(true);
            const tokenRes = await getTokenByMint(tokenId);
            const holdersRes = await getTokenHoldersByMint(tokenId)
            const bondingCurveRes = await getBondingCurveAccounts(new PublicKey(tokenId));
            const walletAddresses = tokenRes.data.allocations.map((a: TokenDistributionItem) => new PublicKey(a.walletAddress));
            const allocationsAndVestingArr = await Promise.all(walletAddresses.map(async (wallet: PublicKey) => {
                const data = await getAllocationsAndVesting([wallet], new PublicKey(tokenId));
                return data;
            }));
            const curveConfigInfo = await getCurveConfig(new PublicKey(bondingCurveRes?.creator || ''), new PublicKey(tokenId));
            
            setAllocationsAndVesting(allocationsAndVestingArr.filter(Boolean));
            setTokenInfo(tokenRes.data);
            setBondingCurveInfo(bondingCurveRes || null);
            setHolders(holdersRes);
            setCurveConfig(curveConfigInfo)
            setCurrentPrice(Number(calculateLinearCurrentPrice(BigInt(bondingCurveRes?.totalSupply || 0), Number(curveConfigInfo?.reserveRatio || 0))));
        } catch (error) {
            console.error('Error loading token info:', error);
        } finally {
            setLoading(false);
        }
    }, [tokenId]);

    const loadCurveConfig = useCallback(async () => {
        const curveConfigInfo = await getCurveConfig(new PublicKey(bondingCurveInfo?.creator || ''), new PublicKey(tokenId));
        setCurveConfig(curveConfigInfo)
    }, [bondingCurveInfo, tokenId])

    const loadBondingCurveInfo = useCallback(async () => {
        const bondingCurveRes = await getBondingCurveAccounts(new PublicKey(tokenId));
        setBondingCurveInfo(bondingCurveRes || null)
    }, [tokenId])

    useEffect(() => {
        loadInfoToken();
    }, [loadInfoToken]);

    useEffect(() => {
        if (tokenInfo) {
            setSelectedPayment({ name: 'SOL', icon: '/chains/sol.jpeg' });
            setSelectedReceive({ name: tokenInfo.symbol, icon: tokenInfo.avatarUrl });
        }
    }, [tokenInfo]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);
    
    const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*\.?\d*$/.test(val)) {
            setPayAmount(val);
            // Clear receive amount if pay amount is empty
            if (!val) {
                setReceiveAmount("");
                return;
            }
            
            if (val && tokenInfo && bondingCurveInfo) {
                const numericVal = parseFloat(val);
                if (!isNaN(numericVal)) {
                    if (selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol) {
                        const linearBuyAmount = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setReceiveAmount((Number(linearBuyAmount) / 10 ** Number(tokenInfo?.decimals || 0)).toFixed(5).toString());
                    }
                    else if (selectedPayment?.name === tokenInfo?.symbol && selectedReceive?.name === 'SOL') {
                        const linearSellAmount = linearSellCost(BigInt(Math.floor(numericVal * 10 ** Number(tokenInfo?.decimals || 0))), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setReceiveAmount((Number(linearSellAmount) / 10 ** 9).toFixed(5).toString());
                    }
                }
            }
        }
    };

    const handleReceiveAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*\.?\d*$/.test(val)) {
            setReceiveAmount(val);
            if (!val) {
                setPayAmount("");
                return;
            }
            
            if (val && tokenInfo && bondingCurveInfo) {
                const numericVal = parseFloat(val);
                if (!isNaN(numericVal)) {
                    if (selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol) {
                        const estimatedCost = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** Number(tokenInfo?.decimals || 0))), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setPayAmount((Number(estimatedCost) / 10 ** 9).toFixed(5).toString());
                    }
                    else if (selectedPayment?.name === tokenInfo?.symbol && selectedReceive?.name === 'SOL') {
                        const linearSellAmount = linearSellCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setPayAmount((Number(linearSellAmount) / 10 ** 9).toFixed(5).toString());
                    }
                }
            }
        }
    };

    if (loading) {
        return <TokenDetailSkeleton />;
    }

    if (!tokenInfo) {
        return (
            <div className="min-h-screen container mx-auto py-10 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Not Found</h2>
                    <p className="text-gray-500">The token you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const tokenOptions = [
        { name: 'SOL', icon: '/chains/sol.jpeg' },
        ...(tokenInfo ? [{ name: tokenInfo.symbol, icon: tokenInfo.avatarUrl }] : [])
    ];
    

    const hasSocialLinks = !!(tokenInfo?.social?.website || tokenInfo?.social?.twitter || tokenInfo?.social?.telegram || tokenInfo?.social?.discord || tokenInfo?.social?.farcaster);

    const getSocialUrl = (type: string, value?: string) => {
        if (!value) return null;
        switch (type) {
            case 'website':
                return value.startsWith('http') ? value : `https://${value}`;
            case 'twitter':
                return value.startsWith('http') ? value : `https://x.com/${value}`;
            case 'telegram':
                return value.startsWith('http') ? value : `https://t.me/${value}`;
            case 'discord':
                return value.startsWith('http') ? value : `https://discord.gg/${value}`;
            case 'farcaster':
                return value.startsWith('http') ? value : `https://warpcast.com/${value}`;  
            default:
                return value;
        }
    };

    const handlePaymentChange = (option: { name: string; icon: string }) => {
        setSelectedPayment(option);
        if (tokenInfo) {
            setSelectedReceive({ name: tokenInfo.symbol, icon: tokenInfo.avatarUrl });
        }
        if (payAmount && tokenInfo && bondingCurveInfo) {
            const numericVal = parseFloat(payAmount);
            if (!isNaN(numericVal)) {
                if (option.name === 'SOL' && tokenInfo) {
                    const linearBuyAmount = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    setReceiveAmount((Number(linearBuyAmount) / 10 ** tokenInfo?.decimals).toFixed(5).toString());
                } else if (option.name === tokenInfo?.symbol) {
                    const linearSellAmount = linearSellCost(BigInt(Math.floor(numericVal * 10 ** Number(tokenInfo?.decimals || 0))), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    setReceiveAmount((Number(linearSellAmount) / 10 ** 9).toFixed(5).toString());
                }
            }
        }
    };



    const handleBuyAndSell = async () => {
        try{
            if (!tokenInfo || !anchorWallet) return;
            setIsBuying(true);
            const mint = new PublicKey(tokenId);
            const amount = Number(payAmount) * 10 ** 9;
            // console.log("amount", amount);
            const admin = new PublicKey(anchorWallet?.publicKey?.toString() || '');
            
            const isBuyOperation = selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol;
            
            if (isBuyOperation) {
                await buyToken(mint, amount, admin, tokenInfo?.name || '');
                // console.log('Buy transaction:', tx);
                setPayAmount("");
                setReceiveAmount("");

                await loadBondingCurveInfo()
                await loadCurveConfig()
            } else {
                await sellToken(mint, amount, admin, tokenInfo?.name || '');
                // console.log('Sell transaction:', tx);
                setPayAmount("");
                setReceiveAmount("");

                await loadBondingCurveInfo()
                await loadCurveConfig()
            }
        } catch (error) {
            console.error('Error in token operation:', error);
        } finally {
            setIsBuying(false);
        }
    }

    return (
        <div className="min-h-screen px-4 xl:container mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 col-span-2 space-y-4">
                <div className="relative">
                    <div className="relative">
                        <img src={tokenInfo?.bannerUrl} alt={tokenInfo?.name} className="w-full h-64 object-cover rounded-lg" />
                        <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                            style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
                    </div>
                    <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                        <div className="flex items-center gap-3">
                            <img src={tokenInfo?.avatarUrl} alt={tokenInfo?.name} className="w-20 h-20 rounded-xl border-[3px] object-cover border-white shadow-md bg-white" />
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white uppercase">{tokenInfo?.name}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg text-white">${tokenInfo?.symbol}</span>
                                    <Badge variant="default" className="bg-green-500 text-white border-white border text-xs px-2 py-0.5 rounded-full">Meme Coin</Badge>
                                </div>
                            </div>
                        </div>
                        {hasSocialLinks && (
                            <div className="flex items-center justify-between gap-6 mr-10 md:mr-14">
                                {tokenInfo?.social?.website && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                onClick={() => {
                                                    const url = getSocialUrl('website', tokenInfo.social.website);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <Globe className="w-6 h-6 text-white hover:text-gray-200" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Visit Website</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {tokenInfo?.social?.farcaster && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                onClick={() => {
                                                    const url = getSocialUrl('farcaster', tokenInfo.social.farcaster);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <img src="/icons/book.svg" alt="Farcaster" className="w-6 h-6 text-white hover:text-gray-200" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View on Farcaster</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {tokenInfo?.social?.discord && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                onClick={() => {
                                                    const url = getSocialUrl('discord', tokenInfo.social.discord);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <img src="/icons/discord.svg" alt="Discord" className="w-6 h-6 text-white hover:text-gray-200" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Join Discord Server</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {tokenInfo?.social?.twitter && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                onClick={() => {
                                                    const url = getSocialUrl('twitter', tokenInfo.social.twitter);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Follow on Twitter</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {tokenInfo?.social?.telegram && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                                onClick={() => {
                                                    const url = getSocialUrl('telegram', tokenInfo.social.telegram);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <img src="/icons/telegram.svg" alt="Telegram" className="w-6 h-6 text-white hover:text-gray-200" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Join Telegram Channel</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile View */}
                <div className="border border-gray-200 rounded-lg bg-gray-50 relative block md:hidden">
                    <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-700"></div>
                            <span className="font-medium text-blue-700">LIVE TRADING</span>
                        </div>

                        <div className="flex flex-col">
                            <div className="text-3xl font-bold text-blue-600">$2.3M</div>
                            <div className="text-xs text-gray-500">Market Cap</div>
                        </div>

                        <div className="grid grid-cols-3">
                            <div>
                                <div className="text-lg font-semibold">-</div>
                                <div className="text-sm text-gray-500">Current Price</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold">{holders.length}</div>
                                <div className="text-sm text-gray-500">Holders</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold">${formatNumberToCurrency(Number(tokenInfo?.targetRaise) * 202.67)}</div>
                                <div className="text-sm text-gray-500">Target</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-t-2xl bg-white w-full">
                        <Tabs className="w-full rounded-lg" defaultValue="trade">
                            <TabsList className="w-full">
                                <TabsTrigger value="trade" className="w-full rounded-lg flex gap-2 items-center">
                                    <img src="/icons/trade-up.svg" alt="Trade" className="w-5 h-5" />
                                    <span>Trade</span>
                                </TabsTrigger>
                                <TabsTrigger value="deposit" className="w-full rounded-lg flex gap-2 items-center">
                                    <Download className="w-4 h-4" />
                                    <span>Deposit</span>
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="trade">
                                <div className="relative">
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="text-sm text-gray-500 mb-2">You Pay</div>
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                                                placeholder="0.00"
                                                value={payAmount}
                                                onChange={handlePayAmountChange}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                        <img src={selectedPayment?.icon} alt={selectedPayment?.name} className="w-5 h-5 rounded-full" />
                                                        <span>{selectedPayment?.name}</span>
                                                        <div className="relative w-4 h-4 mr-5">
                                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                                    {tokenOptions.map((option) => (
                                                        <DropdownMenuItem
                                                            key={option.name}
                                                            onSelect={() => handlePaymentChange(option)}
                                                            className="cursor-pointer hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                                <span>{option.name}</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">-</div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <div className="text-sm text-gray-500 mb-2">You Receive</div>
                                        <div className="flex items-center justify-between">
                                            <input 
                                                type="text" 
                                                className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" 
                                                placeholder="0.00"
                                                disabled
                                                value={receiveAmount} 
                                                onChange={handleReceiveAmountChange} 
                                            />
                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                                                <img src={tokenInfo?.avatarUrl} alt={tokenInfo?.symbol} className="w-6 h-6 rounded-full" />
                                                <span className="text-lg mr-7">{tokenInfo?.symbol}</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">-</div>
                                    </div>

                                    <Button
                                        className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-lg mb-4 ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleBuyAndSell}
                                        disabled={!isLoggedIn || !payAmount || Number(payAmount) <= 0 || isBuying}
                                    >
                                        {isBuying ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            isLoggedIn ? (
                                                selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol 
                                                    ? `Buy $${tokenInfo?.symbol || 'CURATE'}` 
                                                    : `Sell $${tokenInfo?.symbol || 'CURATE'}`
                                            ) : 'Connect Wallet to Trade'
                                        )}
                                    </Button>
                                    <Button className={`border border-gray-200 justify-center gap-2 py-6 rounded-lg text-black bg-gray-100 w-full shadow-none flex items-center ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isLoggedIn}>
                                        <Plus className="h-5 w-5"/>
                                        <span className="disabled:text-gray-400">Add Liquidity</span>
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="deposit">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="text-sm text-gray-500 mb-2">You Pay</div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Mobile DEX Trading Section */}
                    <div className="p-4 flex flex-col gap-2">
                        <h1 className="text-lg font-bold">Trade on DEX</h1>
                        <div className="flex flex-col gap-2">
                            <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="relative w-9 h-9">
                                        <img src="/logos/raydium.png" alt="Raydium" className="w-9 h-9 rounded-full" />
                                        <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm  bg-black flex items-center justify-center">
                                            <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <span>Trade on Raydium</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ExternalLink className="w-5 h-5" />
                                </div>
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span>Trade on other DEX</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full bg-white">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8">
                                                    <img src="/logos/jupiter.png" alt="Jupiter" className="w-8 h-8 rounded-full" />
                                                    <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                                                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                                                    </div>
                                                </div>
                                                <span>Jupiter</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="w-6 h-6" />
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8">
                                                    <img src="/logos/meteora.png" alt="Meteora" className="w-8 h-8 rounded-full" />
                                                    <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                                                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                                                    </div>
                                                </div>
                                                <span>Meteora</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="w-6 h-6" />
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Description</h2>
                    <p className="text-gray-600 text-sm">
                        {tokenInfo?.description}
                    </p>
                </Card>
                
                <LaunchStatus/>
                <LaunchConditions tokenInfo={tokenInfo} />
                <LiquidityPools/>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Allocation & Vesting</h2>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-8 bg-gray-50 rounded-lg py-6 px-4">
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-center">
                            <div className="w-full md:w-[320px] h-[220px] md:h-[220px] flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationsAndVesting.map((item, idx) => ({
                                                name: tokenInfo?.allocations?.[idx]?.description || '-',
                                                value: item?.percentage || 0
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {allocationsAndVesting.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value, _, props) => [`${value}%`, props.payload.name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-3 justify-center">
                                {allocationsAndVesting.map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                        <span className="font-semibold text-base" style={{ color: COLORS[idx % COLORS.length] }}>{tokenInfo?.allocations?.[idx]?.description || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full overflow-x-auto mt-8">
                        <table className="table-fixed w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-white">
                                    <th className="text-left py-3 px-4 text-gray-700 font-bold">Allocation</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-bold">Percentage</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-bold">Tokens</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-bold">USD value</th>
                                    <th className="text-left py-3 px-4 text-gray-700 font-bold">Vesting</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocationsAndVesting.map((item, index) => {
                                    const allocation = tokenInfo?.allocations?.[index];
                                    const tokens = item?.totalTokens ? (Number(item.totalTokens) / Math.pow(10, Number(tokenInfo?.decimals || 0))).toLocaleString() : '-';
                                    // USD value calculation placeholder (replace with real price if available)
                                    const usdValue = '-';
                                    // Vesting info formatting
                                    const vestingInfo = formatVestingInfo(item?.vesting, item?.percentage || 0);
                                    return (
                                        <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                    <span className="font-bold text-gray-900">{allocation?.description || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-medium text-gray-700">{item?.percentage || 0}%</td>
                                            <td className="py-4 px-4 font-medium text-gray-700">{tokens}</td>
                                            <td className="py-4 px-4 font-medium text-gray-700">{usdValue}</td>
                                            <td className="py-4 px-4 text-gray-600 text-sm max-w-[180px] break-all whitespace-pre-line">{vestingInfo}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Vesting Schedule</h2>
                    <div className="w-full h-[280px] md:h-[320px] bg-gray-50 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mergeVestingData(allocationsAndVesting)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    padding={{ left: 20, right: 20 }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        fontSize: 14,
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                {allocationsAndVesting.map((item, idx) => (
                                    <Line
                                        key={item.wallet}
                                        type="monotone"
                                        dataKey={item.wallet}
                                        stroke={COLORS[idx % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
                                        name={tokenInfo?.allocations?.[idx]?.description || item.wallet}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {
                    tokenInfo.selectedPricing === 'bonding-curve' && (
                        //@ts-ignore
                        <BondingCurveChart tokenInfo={tokenInfo} curveConfig={curveConfig} bondingCurveInfo={bondingCurveInfo}/>
                    )
                }
            </div>
            
            {/* Desktop View */}
            <div className="border border-gray-200 rounded-lg max-h-[900px] bg-gray-50 relative hidden md:block">
                <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-700"></div>
                        <span className="font-medium text-blue-700">LIVE TRADING</span>
                    </div>

                    <div className="flex flex-col">
                        <div className="text-3xl font-bold text-blue-600">$2.3M</div>
                        <div className="text-xs text-gray-500">Market Cap</div>
                    </div>

                    <div className="grid grid-cols-3">
                        <div>
                            <div className="text-lg font-semibold">-</div>
                            <div className="text-sm text-gray-500">Current Price</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold">{holders.length}</div>
                            <div className="text-sm text-gray-500">Holders</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold">${formatNumberToCurrency(Number(tokenInfo?.targetRaise) * 202.67)}</div>
                            <div className="text-sm text-gray-500">Target</div>
                        </div>
                    </div>
                </div>
                <div className="border border-gray-200 p-4 rounded-t-2xl bg-white w-full">
                    <Tabs className="w-full rounded-lg" defaultValue="trade">
                        <TabsList className="w-full">
                            <TabsTrigger value="trade" className="w-full rounded-lg flex gap-2 items-center">
                                <img src="/icons/trade-up.svg" alt="Trade" className="w-5 h-5" />
                                <span>Trade</span>
                            </TabsTrigger>
                            <TabsTrigger value="deposit" className="w-full rounded-lg flex gap-2 items-center">
                                <Download className="w-4 h-4" />
                                <span>Deposit</span>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="trade">
                            <div className="relative">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <label className="text-sm text-gray-500 mb-2">You Pay</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            type="text"
                                            className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                                            placeholder="0.00"
                                            value={payAmount}
                                            onChange={handlePayAmountChange}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <img src={selectedPayment?.icon} alt={selectedPayment?.name} className="w-5 h-5 rounded-full" />
                                                    <span>{selectedPayment?.name}</span>
                                                    <div className="relative w-4 h-4 mr-5">
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                                {tokenOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option.name}
                                                        onSelect={() => handlePaymentChange(option)}
                                                        className="cursor-pointer hover:bg-gray-100"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                            <span>{option.name}</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">-</div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <label className="text-sm text-gray-500 mb-2">You Receive</label>
                                    <div className="flex items-center justify-between">
                                        <input 
                                            type="text" 
                                            className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" 
                                            placeholder="0.00"
                                            disabled
                                            value={receiveAmount} 
                                            onChange={handleReceiveAmountChange} 
                                        />
                                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                                            <img src={tokenInfo?.avatarUrl} alt={tokenInfo?.symbol} className="w-6 h-6 rounded-full" />
                                            <span className="text-lg mr-7">{tokenInfo?.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">-</div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="deposit">
                            <div className="flex flex-col space-y-2 mb-5">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <label className="text-sm text-gray-500 mb-2">You Pay</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            type="text"
                                            className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                                            placeholder="0.00"
                                            value={payAmount}
                                            onChange={handlePayAmountChange}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <img src={selectedPayment?.icon} alt={selectedPayment?.name} className="w-5 h-5 rounded-full" />
                                                    <span>{selectedPayment?.name}</span>
                                                    <div className="relative w-4 h-4 mr-5">
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                                {tokenOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option.name}
                                                        onSelect={() => handlePaymentChange(option)}
                                                        className="cursor-pointer hover:bg-gray-100"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                            <span>{option.name}</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <span className="text-sm text-gray-500 mt-1">-</span>
                                </div>
                                <Card className="shadow-none p-3 py-4 space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold">Use this depsoit address</h3>
                                        <p className="text-xs font-extralight text-gray-700">Always double-check your deposit address — it may change without notice.</p>
                                    </div>
                                    <div className="h-[1px] w-full bg-gray-300 mt-2 mb-2"/>
                                    <div className="flex flex-col space-y-5 justify-center items-center">
                                        <div className="border border-gray-200 p-1 rounded-lg">
                                            <img src="/icons/qrcode.svg" alt="QRcode" className="w-40 h-40"/>
                                        </div>
                                        <div className="p-1 flex justify-between items-center px-2 w-full bg-neutral-100 rounded-lg">
                                            <span className="text-sm">qAHMEAU4..........8jiETcaSL5u5sAnZN</span>
                                            <Button className="bg-neutral-100 shadow-none border-none hover:bg-neutral-200 p-1 px-2">
                                                <Copy className="w-3 h-3 text-gray-600" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="pt-3">
                                        <div className="p-3 flex flex-col space-y-1 border border-orange-300 bg-orange-50 rounded-lg">
                                            <h3 className="text-sm font-medium text-orange-500">Only deposit NEAR from the Near network</h3>
                                            <p className="text-xs font-extralight text-orange-400">Depositing other assets or using a different network will result in loss of funds.</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="shadow-none p-3 space-y-4 w-full">
                                    <div className="flex justify-between w-full items-center text-xs text-gray-500">
                                        <span>Minimum Deposit</span>
                                        <span>0.001 SOL</span>
                                    </div>
                                    <div className="flex justify-between w-full items-center text-xs text-gray-500">
                                        <span>Processing Time</span>
                                        <span>~5 mins</span>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="flex flex-col gap-2">
                        <Button
                            className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-lg ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleBuyAndSell}
                            disabled={!isLoggedIn || !payAmount || Number(payAmount) <= 0 || isBuying}
                        >
                            {isBuying ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                    Processing...
                                </span>
                            ) : (
                                isLoggedIn ? (
                                    selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol 
                                        ? `Buy $${tokenInfo?.symbol || 'CURATE'}` 
                                        : `Sell $${tokenInfo?.symbol || 'CURATE'}`
                                ) : 'Connect Wallet to Trade'
                            )}
                        </Button>
                        <Button className={`border border-gray-200 justify-center gap-2 py-6 rounded-lg text-black bg-gray-100 w-full shadow-none flex items-center ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isLoggedIn}>
                            <Plus className="h-5 w-5"/>
                            <span className="disabled:text-gray-400">Add Liquidity</span>
                        </Button>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    <h1 className="text-lg font-bold">Trade on DEX</h1>
                    <div className="flex flex-col gap-2">
                        <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="relative w-9 h-9">
                                    <img src="/logos/raydium.png" alt="Raydium" className="w-9 h-9 rounded-full" />
                                    <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm  bg-black flex items-center justify-center">
                                        <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                                    </div>
                                </div>
                                <span>Trade on Raydium</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExternalLink className="w-5 h-5" />
                            </div>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span>Trade on other DEX</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[370px] bg-white">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8">
                                                <img src="/logos/jupiter.png" alt="Jupiter" className="w-8 h-8 rounded-full" />
                                                <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                                                    <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                                                </div>
                                            </div>
                                            <span>Jupiter</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-6 h-6" />
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center gap03">
                                            <div className="relative w-8 h-8">
                                                <img src="/logos/meteora.png" alt="Meteora" className="w-8 h-8 rounded-full" />
                                                <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                                                    <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                                                </div>
                                            </div>
                                            <span>Meteora</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-6 h-6" />
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
