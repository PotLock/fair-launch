import { ChainInfo, ChainType } from "@/types/bridge.types";
import { NEAR_NETWORK } from "@/configs/env.config";

export const CHAINS: Record<ChainType, ChainInfo> = {
    near: {
        name: 'NEAR',
        icon: '/chains/near-dark.svg',
        color: 'bg-green-500',
        explorerUrl: NEAR_NETWORK === 'testnet'
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

export const AVAILABLE_CHAINS: ChainType[] = ['near', 'solana', 'ethereum'];

export const MIN_BALANCE = {
    sol: 0.0001,
    near: 0.0001,
    eth: 0.001,
};

export const MIN_TARGET_BALANCE = {
    sol: 0.0001,
    near: 3,
    eth: 0.001,
};
