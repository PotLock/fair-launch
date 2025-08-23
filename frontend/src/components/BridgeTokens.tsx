import { useState } from "react";
import { Token } from "../types";
import { InputBridge } from "./InputBridge"
import { Card } from "./ui/card";

interface Chain {
    name: string;
    logo: string;
    address: string;
    balance?: number;
    userAddress: string;
    price: number;
    explorerUrl: string;
}

interface BridgeTokensProps {
    tokenInfo: Token;
    chains: Chain[];
}

export function BridgeTokens({tokenInfo, chains}: BridgeTokensProps){
    const [amount, setAmount] = useState<string|null>(null);

    const [selectedFromChain, setSelectedFromChain] = useState<Chain>(chains[0]);
    const [selectedToChain, setSelectedToChain] = useState<Chain>(chains[1]);

    const handleFromChainChange = (chain: Chain) => {
        setSelectedFromChain(chain);
        if (selectedToChain && selectedToChain.name === chain.name) {
            const availableToChains = chains.filter(c => c.name !== chain.name);
            if (availableToChains.length > 0) {
                setSelectedToChain(availableToChains[0]);
            }
        }
    };

    const handleToChainChange = (chain: Chain) => {
        setSelectedToChain(chain);
        if (selectedFromChain && selectedFromChain.name === chain.name) {
            const availableFromChains = chains.filter(c => c.name !== chain.name);
            if (availableFromChains.length > 0) {
                setSelectedFromChain(availableFromChains[0]);
            }
        }
    };

    return (
        <div className="space-y-4">
            <InputBridge
                title="From"
                tokenInfo={tokenInfo}
                amount={Number(amount)}
                selectedChain={selectedFromChain}
                chains={chains}
                setAmount={(amount: number) => setAmount(String(amount))}
                handleChainChange={handleFromChainChange}
            />
            <InputBridge
                title="To"
                tokenInfo={tokenInfo}
                amount={Number(amount)}
                selectedChain={selectedToChain}
                chains={chains}
                setAmount={(amount: number) => setAmount(String(amount))}
                handleChainChange={handleToChainChange}
            />
            <Card className="p-3 border-gray-200 w-full bg-[#475569]/10 shadow-none">
                <div className="flex flex-col w-full gap-2 text-sm">
                    <div className="flex items-center justify-between md:gap-3 text-sm">
                        <span className="text-gray-600">Estimated Processing Time</span>
                        <span className="text-gray-800">~17s</span>
                    </div>
                    <div className="flex items-center justify-between md:gap-3 text-sm">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="text-gray-800">0.25%</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}