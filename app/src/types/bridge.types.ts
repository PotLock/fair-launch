export type { Transaction } from './api';
export { TransactionAction, TransactionStatus, TransactionChain } from './api';

export interface Token {
    symbol: string;
    balance: string;
    value: string;
    icon: string;
    decimals: number;
    mint: string;
    selected?: boolean;
}

export type ChainType = 'solana' | 'near' | 'ethereum';

export interface ChainInfo {
    name: string;
    icon: string;
    color: string;
    explorerUrl: string;
}

export interface ChainTokens {
    solana: Token[];
    near: Token[];
    ethereum: Token[];
}
