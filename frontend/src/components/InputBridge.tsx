import { Token } from "../types";
import { Card } from "./ui/card";
import { 
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getTokenBalanceOnNEAR } from "../lib/near";
import { getTokenBalanceOnSOL } from "../lib/sol";
import { getTokenBalanceOnEVM } from "../lib/evm";
import { formatNumberToCurrency, formatNumberWithCommas, parseFormattedNumber, truncateAddress } from "../utils";

interface Chain {
    name: string;
    logo: string;
    address: string;
    balance?: number;
    userAddress: string;
    price: number;
    explorerUrl: string;
}

interface InputBridgeProps {
    title: string;
    tokenInfo: Token;
    amount: number;
    selectedChain: Chain;
    chains: Chain[];
    disabled?: boolean;
    setAmount: (amount: number) => void;
    handleChainChange: (chain: Chain) => void;
}

export function InputBridge({
    title, 
    tokenInfo, 
    amount, 
    selectedChain, 
    chains, 
    setAmount, 
    handleChainChange,
    disabled = false
}: InputBridgeProps) {
    const [balanceToken, setTokenBalance] = useState<string|null>(null);
    const [displayAmount, setDisplayAmount] = useState<string>('');

    useEffect(() => {
        setDisplayAmount(formatNumberWithCommas(amount));
    }, [amount]);

    const fetchBalanceToken = useCallback(async()=>{
        switch(selectedChain.name){
            case "NEAR":
                const balanceNear = await getTokenBalanceOnNEAR(selectedChain.address, selectedChain.userAddress)
                setTokenBalance(balanceNear)
                break;
            case "SOLANA":
                const balanceSolana = await getTokenBalanceOnSOL(selectedChain.address, selectedChain.userAddress)
                setTokenBalance(balanceSolana.toString())
                break;
            case "ETHEREUM":
                const balanceEthereum = await getTokenBalanceOnEVM(selectedChain.address, selectedChain.userAddress)
                setTokenBalance(balanceEthereum)
                break;
        }
    },[selectedChain])

    useEffect(()=>{
        fetchBalanceToken()
    },[fetchBalanceToken])

    const handleMaxToken = () => {
        if (balanceToken) {
            const maxAmount = Number(balanceToken);
            setAmount(maxAmount);
            setDisplayAmount(formatNumberWithCommas(maxAmount));
        }
    }

    const handleHalfToken = () => {
        if (balanceToken) {
            const halfAmount = Number(balanceToken) * 0.5;
            setAmount(halfAmount);
            setDisplayAmount(formatNumberWithCommas(halfAmount));
        }
    }

    return (
        <div className="flex flex-col space-y-1">
            <h3 className="text-gray-600">{title}</h3>
            <Card className="p-3 border-gray-200 shadow-none">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 relative">
                            <img src={tokenInfo?.avatarUrl} alt={tokenInfo?.symbol} className="w-8 h-8 rounded-full" />
                            <img src={selectedChain.logo} alt={selectedChain.name} className="w-3 h-3 rounded-full absolute -bottom-0.5 right-0" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{tokenInfo?.symbol}</span>
                            <span className="text-[10px] text-gray-500">{selectedChain.name}</span>
                        </div>
                    </div>
                    <a href={selectedChain.explorerUrl} target="_blank" className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:underline">
                        <span>{truncateAddress(selectedChain.userAddress)}</span>
                    </a>
                </div>

                <div className="flex items-center justify-between w-full">
                    <input
                        type="text"
                        value={displayAmount}
                        disabled={disabled}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            if (/^[0-9,]*$/.test(inputValue) || inputValue === '') {
                                setDisplayAmount(inputValue);
                                const parsedAmount = parseFormattedNumber(inputValue);
                                setAmount(parsedAmount);
                            }
                        }}
                        onBlur={() => {
                            setDisplayAmount(formatNumberWithCommas(amount));
                        }}
                        className="h-auto text-3xl max-w-[230px] font-semibold border-0 focus:outline-none px-1 focus-visible:ring-0 text-left disabled:bg-white"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 px-2 py-2 bg-[#F4F4F5] h-auto">
                                {selectedChain ? (
                                    <>
                                        <img 
                                            src={selectedChain.logo} 
                                            alt={selectedChain.name} 
                                            className="w-5 h-5" 
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <span className="text-sm font-medium">{selectedChain.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm font-medium">Select Chain</span>
                                )}
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                            {chains.map((chain) => (
                                <DropdownMenuItem
                                    key={chain.name}
                                    onClick={() => handleChainChange(chain)}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                                >
                                    <img 
                                        src={chain.logo} 
                                        alt={chain.name} 
                                        className="w-5 h-5" 
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span>{chain.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-gray-600">${amount && formatNumberToCurrency(Number(amount) * selectedChain.price)}</span>
                    <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-600">
                        <span>{formatNumberToCurrency(Number(balanceToken))}</span>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2"
                            onClick={handleHalfToken}
                            disabled={!balanceToken || disabled}
                        >
                            50%
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2"
                            onClick={handleMaxToken}
                            disabled={!balanceToken || disabled}
                        >
                            Max
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}