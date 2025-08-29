import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Holders } from "../types";
import { getBondingCurveAccounts, getTokenHoldersByMint } from "../utils/token";
import { PublicKey } from "@solana/web3.js";
import { formatNumberToCurrency } from "../utils";
import { getCurrentPriceSOL } from "../utils/sol";
import { getSolPrice, getTokenBalanceOnSOL } from "../lib/sol";

interface MyTokenCardProps {
    id: string;
    mint: string,
    user: PublicKey,
    decimals: number,
    banner: string;
    avatar: string;
    name: string;
    symbol: string;
    type: string;
    description: string;
    template: string;
    solPrice: number;
    actionButton: {
        text: string;
        variant: 'presale' | 'curve' | 'trade';
    };
    className?: string;
}

export function MyTokenCard({
    mint,
    user,
    decimals,
    banner,
    avatar,
    name,
    symbol,
    type,
    description,
    template,
    solPrice,
    actionButton,
    className
}: MyTokenCardProps){
    const [currentPrice, setCurrentPrice] = useState<number|null>(null)
    const [balance, setBalance] = useState<number>(0)

    const fetchBalanceToken = useCallback(async()=>{
        const balance = await getTokenBalanceOnSOL(mint, user?.toBase58() || '')
        setBalance(balance)
    },[mint, user])

    const fetchBondingCurveAccounts = useCallback(async () => {
        if(!mint) return;
        const bondingCurveAccounts = await getBondingCurveAccounts(new PublicKey(mint));
        const priceSol = getCurrentPriceSOL(
            BigInt(bondingCurveAccounts?.reserveBalance || 0),
            BigInt(bondingCurveAccounts?.reserveToken || 0)
        );
        setCurrentPrice(priceSol)
    },[mint])

    useEffect(() => {
        fetchBondingCurveAccounts()
        fetchBalanceToken()
    }, [fetchBondingCurveAccounts,fetchBalanceToken])

    const navigate = useNavigate()

    const getActionButtonStyle = (variant: string) => {
        switch (variant) {
            case 'presale': return 'bg-red-500 hover:bg-red-600';
            case 'curve': return 'bg-red-500 hover:bg-red-600';
            case 'trade': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-red-500 hover:bg-red-600';
        }
    };

    const value = balance * (Number(currentPrice || 0) * solPrice)

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
                            <span className="text-white/70 text-sm">•</span>
                            <span className="text-white/90 text-sm">{type}</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-6">
                        <span className={`bg-green-100 text-green-500 text-xs px-3 py-1 rounded-full font-medium`}>
                            {template}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative mt-2">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {description}
                </p>

                <div className="grid grid-cols-3 md:gap-4 mt-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">{formatNumberToCurrency(balance)} {symbol}</span>
                        <span className="text-gray-500 text-xs">Your Balance</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">${formatNumberToCurrency(value)}</span>
                        <span className="text-gray-500 text-xs">Value</span>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center flex flex-col"
                    >
                        <span className="font-bold text-gray-900">0%</span>
                        <span className="text-gray-500 text-xs">24h Change</span>
                    </motion.div>
                </div>

                <div className="flex gap-10 mt-8">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>navigate({to: `/token/${mint}`})} 
                        className="flex-1 bg-white border border-gray-300 text-gray-800 py-1.5 px-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm">View Details</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={()=>navigate({to: `/token/${mint}`})} 
                        className={`flex-1 ${getActionButtonStyle(actionButton.variant)} text-white py-1.5 px-2 rounded-md font-medium transition-colors`}
                    >
                        <span className="text-sm">{actionButton.text}</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}