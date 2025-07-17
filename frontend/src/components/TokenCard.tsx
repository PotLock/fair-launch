import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SOL_NETWORK } from "../configs/env.config";
import { formatNumberWithCommas } from "../utils";
import { useEffect, useState } from "react";
import { getBondingCurveAccounts } from "../utils/tokenUtils";
import { PublicKey } from "@solana/web3.js";


interface BondingCurve {
    creator: string;
    totalSupply: number;
    reserveBalance: number;
    reserveToken: number;
    token: string;
    reserveRatio: number;
    bump: number;
} 

interface TokenCardProps {
    banner?: string;
    avatar?: string;
    name: string;
    symbol: string;
    type: string;
    description: string;
    progress: number;
    supply: string;
    address: string;
    createdOn: string;
    marketCap?: string;
    price?: string;
    externalLabel: string;
    value: string;
    decimals: number;
}

export function TokenCard({
    banner = "/curate.png",
    avatar,
    name,
    symbol,
    type = "Meme Coin",
    description,
    progress,
    supply,
    address,
    createdOn,
    marketCap,
    price,
    externalLabel,
    value,
    decimals,
}: TokenCardProps) {
    const navigate = useNavigate();
    const [bondingCurve, setBondingCurve] = useState<BondingCurve|null>(null);
    useEffect(()=>{
        const fetchBondingCurveAccounts = async () => {
            if(!address) return;
            const bondingCurveAccounts = await getBondingCurveAccounts(new PublicKey(address));
            setBondingCurve(bondingCurveAccounts || null);
        }
        fetchBondingCurveAccounts();
    },[address])

    // Calculate progress: if bondingCurve exists, use totalSupply/supply
    let progressValue = progress;
    const supplyNumber = Number(supply);
    if (bondingCurve && supplyNumber > 0) {
        progressValue = (Number(bondingCurve.totalSupply) / (supplyNumber * 10 ** decimals)) * 100;
    }


    return (
        <Card
            onClick={() => navigate({ to: `/token/${value}` })}
            className="rounded-3xl border-2 border-gray-200 bg-white p-0 overflow-hidden transition hover:shadow-lg cursor-pointer ">
            <div className="relative p-3">
                <div className="relative">
                    <img src={banner} alt={name} className="w-full h-48 object-cover rounded-2xl" />
                    <div className="absolute left-0 bottom-0 w-full h-48 rounded-b-2xl pointer-events-none"
                        style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'}} />
                    </div>
                    <div className="absolute left-5 bottom-6 flex items-center gap-3 flex-row justify-between w-full">
                    <img src={avatar} alt={name} className="w-14 h-14 rounded-full border-2 object-cover border-white shadow-md bg-white" />
                    <div className="flex flex-col mr-12">
                        <span className="text-xl font-bold text-white uppercase">{name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-white">${symbol}</span>
                            <Badge variant="default" className="bg-green-500 text-white border-white border text-xs px-2 py-0.5 rounded-full">{type}</Badge>
                        </div>
                    </div>
                </div>
            </div>
            <CardContent className="pt-14 p-3">
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">{description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    {
                        bondingCurve && (
                            <span>{formatNumberWithCommas(bondingCurve.totalSupply / 10 ** decimals)} / {formatNumberWithCommas(supplyNumber)}</span>
                        )
                    }
                </div>
                <Progress value={progressValue} bgProgress="bg-black" className="h-4 bg-gray-200 mb-4" />
                <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                    <div>
                        <div className="text-gray-400">Token Address</div>
                        <a href={`https://solscan.io/token/${address}?cluster=${SOL_NETWORK}`} target="_blank" className="font-medium text-gray-800 truncate hover:underline">
                            {address.slice(0, 6)}...{address.slice(-6)}
                        </a>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400">Created On</div>
                        <div className="font-medium text-gray-800">{createdOn}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                        <div className="text-gray-400">Market Cap</div>
                        <div className="font-bold text-gray-900">{marketCap || '-'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400">Price</div>
                        <div className="font-bold text-gray-900">{price || '-'}</div>
                    </div>
                </div>
                <div className="flex gap-2 mt-2">
                    <Button onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: `/token/${value}` })
                    }} variant="outline" className="flex-1 rounded-md text-sm border-gray-300 py-2">View Details</Button>
                    {/* <Button onClick={(e) => {
                        e.stopPropagation();
                        
                    }} variant="secondary" className="flex-1 flex items-center text-sm gap-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white py-2">
                        <ExternalLink className="w-4 h-4" />
                        View on {externalLabel}
                    </Button> */}
                </div>
            </CardContent>
        </Card>
    );
} 