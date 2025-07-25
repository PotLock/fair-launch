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
import { Globe, Copy, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useCallback, useState,useEffect } from "react";
import { BondingCurveTokenInfo, getAllocationsAndVesting, getBondingCurveAccounts, getCurveConfig, getTokenHoldersByMint, TokenInfo } from "../../utils/tokenUtils";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { copyToClipboard, formatNumberWithCommas, truncateAddress, calculateTimeSinceCreation } from "../../utils";
import { TokenDetailSkeleton } from "../../components/TokenDetailSkeleton";
import { useTokenTrading } from "../../hook/useTokenTrading";
import { PublicKey } from "@solana/web3.js";
import { Button } from "../../components/ui/button";
import { getTokenByMint } from "../../lib/api";
import { linearBuyCost, linearSellCost } from "../../utils/sol";
import { TokenDistributionItem, Holders} from "../../types"
import { Progress } from "../../components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../components/ui/tooltip";
import { formatVestingInfo, mergeVestingData } from "../../utils";

export const Route = createFileRoute("/token/$tokenId")({
    component: TokenDetail,
});

const COLORS = ['#00A478', '#8B5CF6', '#3B82F6', '#059669', '#DC2626', '#2563EB'];



const getEmptyBondingCurveData = () => Array.from({ length: 20 }, (_, i) => ({
    raised: '-',
    price: '-'
}));

// Hàm sinh dữ liệu chart cho Linear Bonding Curve
function generateLinearBondingCurveChartData(
    tokenInfo: TokenInfo | null,
    curveConfig: any,
    bondingCurveInfo: BondingCurveTokenInfo | null
) {
    if (!tokenInfo || !curveConfig) return [];
    const decimals = tokenInfo.decimals || 9;
    const maxSupply = Number(curveConfig.maxTokenSupply) / 10 ** decimals;
    const reserveRatio = Number(curveConfig.reserveRatio);
    const initialPrice = Number(curveConfig.initialPrice) / 10 ** 9;
    const points = 20;
    const data = [];
    for (let i = 0; i <= points; i++) {
        const supply = (maxSupply / points) * i;
        // Linear price: P = initialPrice + (supply * reserveRatio / maxSupply)
        // Hoặc dùng công thức bonding curve thực tế nếu có
        // Ở đây ví dụ dùng linearBuyCost nếu là linear
        // Đơn vị supply là token, cần convert về smallest unit
        const supplySmallest = BigInt(Math.floor(supply * 10 ** decimals));
        const totalSupply = BigInt(0); // Giả sử bắt đầu từ 0
        // Sử dụng linearBuyCost để tính tổng số SOL cần để mint supplySmallest token
        // Giá tại điểm này là chi phí để mua 1 token tiếp theo
        let price = 0;
        try {
            price = Number(linearBuyCost(1n * 10n ** BigInt(decimals), reserveRatio, supplySmallest)) / 10 ** 9;
        } catch (e) {
            price = 0;
        }
        const raised = supply * price;
        data.push({ raised, price });
    }
    return data;
}

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
        } catch (error) {
            console.error('Error loading token info:', error);
        } finally {
            setLoading(false);
        }
    }, [tokenId]);

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
                    // Check if it's a buy operation (SOL -> Token)
                    if (selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol) {
                        const linearBuyAmount = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setReceiveAmount((Number(linearBuyAmount) / 10 ** tokenInfo?.decimals).toFixed(5).toString());
                    }
                    // Check if it's a sell operation (Token -> SOL)
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
            // Clear pay amount if receive amount is empty
            if (!val) {
                setPayAmount("");
                return;
            }
            
            if (val && tokenInfo && bondingCurveInfo) {
                const numericVal = parseFloat(val);
                if (!isNaN(numericVal)) {
                    // Check if it's a buy operation (SOL -> Token)
                    if (selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol) {
                        const estimatedCost = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                        setPayAmount((Number(estimatedCost) / 10 ** 9).toFixed(5).toString());
                    }
                    // Check if it's a sell operation (Token -> SOL)
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


    const progress = (Number(bondingCurveInfo?.totalSupply) / (Number(tokenInfo?.supply) * 10 ** Number(tokenInfo?.decimals))) * 100

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
        if (option.name === 'SOL' && tokenInfo) {
            setSelectedReceive({ name: tokenInfo.symbol, icon: tokenInfo.avatarUrl });
        } 
        else if (option.name === tokenInfo?.symbol) {
            setSelectedReceive({ name: 'SOL', icon: '/chains/sol.jpeg' });
        }
        // Recalculate amounts when payment option changes
        if (payAmount && tokenInfo && bondingCurveInfo) {
            const numericVal = parseFloat(payAmount);
            if (!isNaN(numericVal)) {
                if (option.name === 'SOL' && tokenInfo) {
                    // Buy operation: SOL -> Token
                    const linearBuyAmount = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    console.log('linearBuyAmount', linearBuyAmount)
                    setReceiveAmount((Number(linearBuyAmount) / 10 ** 9).toFixed(5).toString());
                } else if (option.name === tokenInfo?.symbol) {
                    // Sell operation: Token -> SOL
                    const linearSellAmount = linearSellCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    console.log("linearSellAmount", linearSellAmount)
                    setReceiveAmount((Number(linearSellAmount) / 10 ** 9).toFixed(5).toString());
                }
            }
        }
    };

    const handleReceiveChange = (option: { name: string; icon: string }) => {
        setSelectedReceive(option);
        if (option.name === tokenInfo?.symbol) {
            setSelectedPayment({ name: 'SOL', icon: '/chains/sol.jpeg' });
        } 
        else if (option.name === 'SOL' && tokenInfo) {
            setSelectedPayment({ name: tokenInfo.symbol, icon: tokenInfo.avatarUrl });
        }
        
        // Recalculate amounts when receive option changes
        if (receiveAmount && tokenInfo && bondingCurveInfo) {
            const numericVal = parseFloat(receiveAmount);
            if (!isNaN(numericVal)) {
                if (option.name === tokenInfo?.symbol) {
                    // Buy operation: SOL -> Token
                    const estimatedCost = linearBuyCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    setPayAmount((Number(estimatedCost) / 10 ** 9).toFixed(5).toString());
                } else if (option.name === 'SOL' && tokenInfo) {
                    // Sell operation: Token -> SOL
                    const linearSellAmount = linearSellCost(BigInt(Math.floor(numericVal * 10 ** 9)), Number(curveConfig?.reserveRatio || 0), BigInt(bondingCurveInfo?.totalSupply || 0));
                    setPayAmount((Number(linearSellAmount) / 10 ** 9).toFixed(5).toString());
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
            console.log("amount", amount);
            const admin = new PublicKey(anchorWallet?.publicKey?.toString() || '');
            
            const isBuyOperation = selectedPayment?.name === 'SOL' && selectedReceive?.name === tokenInfo?.symbol;
            
            if (isBuyOperation) {
                const tx = await buyToken(mint, amount, admin, tokenInfo?.name || '');
                console.log('Buy transaction:', tx);
                // Clear input fields after successful buy
                setPayAmount("");
                setReceiveAmount("");
            } else {
                const tx = await sellToken(mint, amount, admin, tokenInfo?.name || '');
                console.log('Sell transaction:', tx);
                // Clear input fields after successful sell
                setPayAmount("");
                setReceiveAmount("");
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
                                    <button 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        onClick={() => {
                                            const url = getSocialUrl('website', tokenInfo.social.website);
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        <Globe className="w-6 h-6 text-white hover:text-gray-200" />
                                    </button>
                                )}
                                {tokenInfo?.social?.farcaster && (
                                    <button 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        onClick={() => {
                                            const url = getSocialUrl('farcaster', tokenInfo.social.farcaster);
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        <img src="/icons/book.svg" alt="Farcaster" className="w-6 h-6 text-white hover:text-gray-200" />
                                    </button>
                                )}
                                {tokenInfo?.social?.discord && (
                                    <button 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        onClick={() => {
                                            const url = getSocialUrl('discord', tokenInfo.social.discord);
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        <img src="/icons/discord.svg" alt="Discord" className="w-6 h-6 text-white hover:text-gray-200" />
                                    </button>
                                )}
                                {tokenInfo?.social?.twitter && (
                                    <button 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        onClick={() => {
                                            const url = getSocialUrl('twitter', tokenInfo.social.twitter);
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
                                    </button>
                                )}
                                {tokenInfo?.social?.telegram && (
                                    <button 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        onClick={() => {
                                            const url = getSocialUrl('telegram', tokenInfo.social.telegram);
                                            if (url) window.open(url, '_blank');
                                        }}
                                    >
                                        <img src="/icons/telegram.svg" alt="Telegram" className="w-6 h-6 text-white hover:text-gray-200" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg bg-gray-50 relative block md:hidden">
                    <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">ACTIVE</span>
                            <span className="ml-auto text-sm text-green-600 border border-green-600 rounded-md bg-green-50 px-2 py-1">{tokenInfo?.createdOn ? calculateTimeSinceCreation(tokenInfo.createdOn, currentTime) : "-"}</span>
                        </div>

                        <div className="text-3xl font-bold text-green-600 mb-3">-</div>

                        <div className="w-full mb-8">
                            <Progress value={progress} className="h-2 bg-gray-200">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                            </Progress>
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
                                <div className="text-lg font-semibold">{tokenInfo?.targetRaise}</div>
                                <div className="text-sm text-gray-500">Target</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-semibold">Join Presale</span>
                            <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-full">
                                {tokenInfo?.selectedPricing === 'bonding-curve' ? 'Bonding Curve' : 
                                 tokenInfo?.selectedPricing === 'fixed-price' ? 'Fixed Price' : 
                                 tokenInfo?.selectedPricing}
                            </span>
                        </div>

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
                                    value={receiveAmount} 
                                    onChange={handleReceiveAmountChange} 
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                            <img src={selectedReceive?.icon} alt={selectedReceive?.name} className="w-5 h-5 rounded-full" />
                                            <span>{selectedReceive?.name}</span>
                                            <div className="relative w-4 h-4 mr-5">
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                        {tokenOptions.map((option) => (
                                            <DropdownMenuItem
                                                key={option.name}
                                                onSelect={() => handleReceiveChange(option)}
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

                        <Button
                            className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg mb-4 ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    </div>
                    <div className="p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg mb-4">
                        <p className="text-xs text-gray-500 text-center">
                            Tokens will be distributed to your wallet after the presale ends. Always do your own research.
                        </p>
                    </div>
                </div>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Description</h2>
                    <p className="text-gray-600 text-sm">
                        {tokenInfo?.description}
                    </p>
                </Card>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Tokenomics & Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 gap-3 mt-5 border-b border-gray-200 pb-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Initial Market Cap</p>
                                <p className="text-sm font-semibold">-</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Total supply</p>
                                <p className="text-sm font-semibold">{formatNumberWithCommas(tokenInfo?.supply || 0)}</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Min. Contribution</p>
                                <p className="text-sm font-semibold">{tokenInfo?.minimumContribution} SOL</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Current price</p>
                                <p className="text-sm font-semibold">-</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Hard cap</p>
                                <p className="text-sm font-semibold">{tokenInfo?.hardCap} SOL</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Max Contribution</p>
                                <p className="text-sm font-semibold">{tokenInfo?.maximumContribution} SOL</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mt-2">
                        <label className="text-sm text-gray-500">Contract Address</label>
                        <div className="flex flex-row gap-2 items-center">
                            <img src="/icons/solana.svg" alt="SOL" className="w-6 h-6" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={`https://solscan.io/token/${tokenId}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                                        <p className="text-sm text-gray-500 cursor-pointer hover:underline">{truncateAddress(tokenId || '')}</p>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={4} className="bg-white border border-gray-200">
                                    <span className="font-mono">{tokenId}</span>
                                </TooltipContent>
                            </Tooltip>
                            <button className="w-4 h-4 rounded-full flex items-center justify-center" onClick={() => copyToClipboard(tokenId || '')}>
                                <Copy className="w-4 h-4 text-black hover:text-gray-500" />
                            </button>
                        </div>
                    </div>
                </Card>

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
                                        <RechartsTooltip formatter={(value, name, props) => [`${value}%`, props.payload.name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-3 justify-center">
                                {allocationsAndVesting.map((item, idx) => (
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

                {/* TODO: add current price */}
                {/* {
                    tokenInfo.selectedPricing === 'bonding-curve' && (
                        <Card className="p-4 md:p-6 shadow-none">
                            <h2 className="text-xl font-medium mb-4">Bonding Curve Price Chart</h2>
                            <div className="mb-6 w-full h-[280px] md:h-[320px] bg-gray-50 rounded-lg p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={generateLinearBondingCurveChartData(tokenInfo, curveConfig, bondingCurveInfo)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="raised"
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
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#8884d8"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#8884d8' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 mb-1">Initial Price</p>
                                    <p className="font-semibold">{curveConfig ? (Number(curveConfig.initialPrice) / 10 ** 9).toLocaleString() : '-'} SOL</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 mb-1">Final Price</p>
                                    <p className="font-semibold">{tokenInfo?.finalPrice || '-'} SOL</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 mb-1">Target Raise</p>
                                    <p className="font-semibold">{tokenInfo?.targetRaise || '-'} SOL</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">
                                This token uses a bonding curve, meaning its price changes dynamically based on demand and supply.
                                The price increases as more tokens are minted and purchased.
                            </p>
                        </Card>
                    )
                } */}
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-[730px] bg-gray-50 relative hidden md:block">
                <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium">ACTIVE</span>
                        <span className="ml-auto text-sm text-green-600 border border-green-600 rounded-md bg-green-50 px-2 py-1">{tokenInfo?.createdAt ? calculateTimeSinceCreation(tokenInfo.createdAt, currentTime) : "-"}</span>
                    </div>

                    <div className="text-3xl font-bold text-green-600 mb-3">-</div>

                    <div className="w-full mb-8">
                        <Progress value={progress} bgProgress="bg-green-600" className="h-2 bg-gray-200"/>
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
                            <div className="text-lg font-semibold">{tokenInfo?.targetRaise} SOL</div>
                            <div className="text-sm text-gray-500">Target</div>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-semibold">Join Presale</span>
                        <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-full">
                            {tokenInfo?.selectedPricing === 'bonding-curve' ? 'Bonding Curve' : 
                             tokenInfo?.selectedPricing === 'fixed-price' ? 'Fixed Price' : 
                             tokenInfo?.selectedPricing}
                        </span>
                    </div>

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
                                value={receiveAmount} 
                                onChange={handleReceiveAmountChange} 
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                        <img src={selectedReceive?.icon} alt={selectedReceive?.name} className="w-5 h-5 rounded-full" />
                                        <span>{selectedReceive?.name}</span>
                                        <div className="relative w-4 h-4 mr-5">
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                    {tokenOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.name}
                                            onSelect={() => handleReceiveChange(option)}
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

                    <Button
                        className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg mb-4 ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                </div>
                <div className="absolute bottom-5 left-0 right-0 p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg">
                    <p className="text-xs text-gray-500 text-center">
                        Tokens will be distributed to your wallet after the presale ends. Always do your own research.
                    </p>
                </div>
            </div>
        </div>
    );
}
