"use client"
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { 
  getTokenHolders,
  getPoolStateByMint,
  getPoolConfigByMint,
} from "@/lib/api";
import { 
    formatNumberToCurrency, 
    calculateTokenPrice, 
    formatTokenPrice, 
    calculateMarketCap, 
    formatMarketCap, 
    hexToNumber
} from "@/utils";
import { getSolPrice } from "@/lib/sol";


interface ExploreTokenCardProps {
    id: string;
    mint: string,
    decimals: number,
    totalSupply: string;
    banner: string;
    avatar: string;
    name: string;
    symbol: string;
    description: string;
    actionButton: {
        text: string;
        variant: 'presale' | 'curve' | 'trade';
    };
    className?: string;
}

interface TokenData {
    price: number;
    holders: number;
    marketCap: number;
    supply: string;
}

export default function ExploreTokenCard({
    mint,
    decimals,
    totalSupply,
    banner,
    avatar,
    name,
    symbol,    
    description,
    actionButton,
    className
}: ExploreTokenCardProps){
    const navigate = useRouter()
    const [tokenData, setTokenData] = useState<TokenData>({
        price: 0,
        holders: 0,
        marketCap: 0,
        supply: '0'
    });
    const [loading, setLoading] = useState(true);

    const fetchTokenData = useCallback(async () => {
        const solPrice = await getSolPrice();
        if(!solPrice) return;
        try {
            setLoading(true);
            
            const [holders, pool, poolConfig] = await Promise.all([
                getTokenHolders(mint),
                getPoolStateByMint(mint),
                getPoolConfigByMint(mint)
            ]);
            const migrationQuoteThreshold = hexToNumber(poolConfig?.migrationQuoteThreshold);
            const migrationBaseThreshold = hexToNumber(poolConfig?.migrationBaseThreshold);
            
            const curveProgress = migrationQuoteThreshold > 0
                ? Number(pool?.account?.quoteReserve || 0) / migrationQuoteThreshold
                : 0;
            
            const baseSold = curveProgress * migrationBaseThreshold / Math.pow(10, decimals);

            const price = pool?.account?.sqrtPrice 
                ? calculateTokenPrice(pool.account.sqrtPrice)
                : 0;

            const marketCap = calculateMarketCap(baseSold, totalSupply, decimals);

            setTokenData({
                price: price * solPrice,
                holders: holders.length,
                marketCap,
                supply: formatNumberToCurrency(Number(totalSupply))
            });
        } catch (error) {
            console.error('Error fetching token data:', error);
            // Keep default values on error
        } finally {
            setLoading(false);
        }
    }, [mint, totalSupply, decimals]);
    
    useEffect(() => {
        fetchTokenData();
    }, [fetchTokenData]);

    const getActionButtonStyle = (variant: string) => {
        switch (variant) {
            case 'presale': return 'bg-red-500 hover:bg-red-600';
            case 'curve': return 'bg-red-500 hover:bg-red-600';
            case 'trade': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-red-500 hover:bg-red-600';
        }
    };

    return (
        <motion.div
            whileHover={{ 
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1, ease: "easeIn" }
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`bg-white rounded-xl border-[1.5px] border-gray-200 overflow-hidden cursor-pointer p-4 md:max-w-[365px] shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}
        >
            <div className="relative">
                <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={banner} 
                    alt={name} 
                    className="w-full h-48 object-cover rounded-xl" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />

                <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full">
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h3 className="text-white font-bold text-lg">{name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-white/90 text-sm">${symbol}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mt-2">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {description}
                </p>

                <div className="grid grid-cols-4 md:gap-4 mt-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">
                            {loading ? '...' : `$${formatTokenPrice(tokenData.price)}`}
                        </span>
                        <span className="text-gray-500 text-xs">Price</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">
                            {loading ? '...' : tokenData.supply}
                        </span>
                        <span className="text-gray-500 text-xs">Supply</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">
                            {loading ? '...' : tokenData.holders}
                        </span>
                        <span className="text-gray-500 text-xs">Holders</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">
                            {loading ? '...' : formatMarketCap(tokenData.marketCap)}
                        </span>
                        <span className="text-gray-500 text-xs">Market Cap</span>
                    </motion.div>
                </div>

                <div className="flex gap-10 mt-8">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>navigate.push(`/token/${mint}`)} 
                        className="flex-1 bg-white border border-gray-300 text-gray-800 py-1.5 px-2 rounded-md font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <span className="text-sm">View Details</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>navigate.push(`/token/${mint}`)} 
                        className={`flex-1 ${getActionButtonStyle(actionButton.variant)} text-white py-1.5 px-2 rounded-md font-medium transition-colors cursor-pointer`}
                    >
                        <span className="text-sm">{actionButton.text}</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}