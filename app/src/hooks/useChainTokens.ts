import { useState, useEffect } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import { Token, ChainType } from "@/types/bridge.types";
import { formatBalanceNear, getAllTokenOnNear } from "@/lib/near";
import { getAllTokens as getSolanaTokens } from "@/lib/sol";
import { getAllTokens as getEthereumTokens } from "@/lib/evm";

export const useChainTokens = () => {
    const { signedAccountId } = useWalletSelector();
    const { connected, publicKey } = useWallet();
    const { address: ethereumAddress } = useAccount();

    const [solanaTokens, setSolanaTokens] = useState<Token[]>([]);
    const [nearTokens, setNearTokens] = useState<Token[]>([]);
    const [ethereumTokens, setEthereumTokens] = useState<Token[]>([]);

    const [isLoadingSolanaTokens, setIsLoadingSolanaTokens] = useState(false);
    const [isLoadingNearTokens, setIsLoadingNearTokens] = useState(false);
    const [isLoadingEthereumTokens, setIsLoadingEthereumTokens] = useState(false);

    // Fetch Solana tokens
    const fetchSolanaTokens = async () => {
        if (!connected || !publicKey) return;

        setIsLoadingSolanaTokens(true);
        try {
            const tokens = await getSolanaTokens(publicKey.toString());
            const formattedTokens: Token[] = tokens.map(token => ({
                symbol: token.symbol,
                balance: token.balance.toString(),
                value: '0',
                icon: token.image || '/chains/solana.svg',
                decimals: token.decimals,
                mint: token.mint
            }));

            setSolanaTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching Solana tokens:', error);
        } finally {
            setIsLoadingSolanaTokens(false);
        }
    };

    // Fetch NEAR tokens
    const fetchNearTokens = async () => {
        if (!signedAccountId) return;

        setIsLoadingNearTokens(true);
        try {
            const tokens = await getAllTokenOnNear(signedAccountId);
            const formattedTokens: Token[] = tokens.map((token: any, index: number) => ({
                symbol: token.ft_meta?.symbol || `${index}`,
                balance: formatBalanceNear(token.amount) || '0',
                value: '0',
                icon: token.ft_meta?.icon || '/icons/default-token.svg',
                decimals: token.ft_meta?.decimals || 24,
                mint: token.contract
            }));

            setNearTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching NEAR tokens:', error);
        } finally {
            setIsLoadingNearTokens(false);
        }
    };

    // Fetch Ethereum tokens
    const fetchEthereumTokens = async () => {
        if (!ethereumAddress) return;

        setIsLoadingEthereumTokens(true);
        try {
            const tokens = await getEthereumTokens(ethereumAddress);
            const formattedTokens: Token[] = tokens.map(token => ({
                symbol: token.symbol,
                balance: token.balance,
                value: '0',
                icon: token.logo || '/chains/ethereum.svg',
                decimals: token.decimals,
                mint: token.address
            }));

            setEthereumTokens(formattedTokens);
        } catch (error) {
            console.error('Error fetching Ethereum tokens:', error);
        } finally {
            setIsLoadingEthereumTokens(false);
        }
    };

    // Effects to fetch tokens when wallets connect
    useEffect(() => {
        if (connected && publicKey) {
            fetchSolanaTokens();
        } else {
            setSolanaTokens([]);
        }
    }, [connected, publicKey?.toString()]);

    useEffect(() => {
        if (signedAccountId) {
            fetchNearTokens();
        } else {
            setNearTokens([]);
        }
    }, [signedAccountId]);

    useEffect(() => {
        if (ethereumAddress) {
            fetchEthereumTokens();
        } else {
            setEthereumTokens([]);
        }
    }, [ethereumAddress]);

    // Get tokens for a specific chain
    const getTokensForChain = (chain: ChainType): Token[] => {
        switch (chain) {
            case 'solana':
                return solanaTokens;
            case 'near':
                return nearTokens;
            case 'ethereum':
                return ethereumTokens;
            default:
                return [];
        }
    };

    // Get loading state for a specific chain
    const getLoadingStateForChain = (chain: ChainType): boolean => {
        switch (chain) {
            case 'solana':
                return isLoadingSolanaTokens;
            case 'near':
                return isLoadingNearTokens;
            case 'ethereum':
                return isLoadingEthereumTokens;
            default:
                return false;
        }
    };

    return {
        solanaTokens,
        nearTokens,
        ethereumTokens,
        isLoadingSolanaTokens,
        isLoadingNearTokens,
        isLoadingEthereumTokens,
        fetchSolanaTokens,
        fetchNearTokens,
        fetchEthereumTokens,
        getTokensForChain,
        getLoadingStateForChain
    };
};
