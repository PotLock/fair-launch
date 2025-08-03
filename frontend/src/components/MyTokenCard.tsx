import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { formatNumberWithCommas } from "../utils";
import { useNavigate } from "@tanstack/react-router";
import { BondingCurveTokenInfo, getBondingCurveAccounts } from "../utils/tokenUtils";
import { useCallback, useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";

interface MyTokenCardProps {
    avatar?: string;
    name: string;
    symbol: string;
    supply: string;
    mintAddress: string;
    decimals: number;
}

export function MyTokenCard({ avatar, name, symbol, supply, mintAddress, decimals }: MyTokenCardProps) {
    const navigate = useNavigate();
    const [bondingCurveInfo, setBondingCurveInfo] = useState<BondingCurveTokenInfo | null>(null);
    
    const loadBondingCurveInfo = useCallback(async () => {
        const bondingCurveRes = await getBondingCurveAccounts(new PublicKey(mintAddress));
        setBondingCurveInfo(bondingCurveRes || null)
    }, [mintAddress])

    useEffect(() => {
        loadBondingCurveInfo()
    }, [loadBondingCurveInfo])

    const progress = (Number(bondingCurveInfo?.totalSupply) / (Number(supply) * 10 ** Number(decimals))) * 100

    return (
        <Card className="w-full max-w-lg" onClick={() => navigate({to: `/token/${mintAddress}`})}>
            <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-full flex items-center justify-center">
                        {avatar ? (
                        <img src={avatar} alt={`${name} Icon`} className="w-11 h-11 rounded-full" />
                        ) : (
                        <img src="/public/icons/custom-token.svg" alt="Token Icon" className="w-11 h-11" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            ${symbol} <span className="mx-1">•</span> Fixed price
                        </CardDescription>
                    </div>
                </div>
                <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    Active
                </span>
            </CardHeader>
            <hr className="border-gray-200" />
            <CardContent className="py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-base font-semibold">{formatNumberWithCommas(supply)} ${symbol}</div>
                        <div className="text-gray-400 text-base">$250,000</div>
                    </div>
                    <Button 
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md shadow" 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate({to: `/token/${mintAddress}`});
                        }}>
                        View Token
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start pt-0 gap-1">
                <div className="w-full">
                    <Progress value={progress} bgProgress="bg-green-600" className="h-2 bg-gray-200"/>
                </div>
                <div className="flex justify-between w-full text-xs text-gray-400">
                    <span>{progress}%</span>
                </div>
            </CardFooter>
        </Card>
    );
}