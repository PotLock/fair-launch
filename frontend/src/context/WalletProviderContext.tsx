import React, { ReactNode, useMemo, createContext, useContext, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import * as walletAdapterWallets from "@solana/wallet-adapter-wallets";
import { getSOLNetwork } from "../utils/sol";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ALCHEMY_API_KEY } from "../configs/env.config";

export type ChainType = 'solana' | 'near' | 'evm';

interface ChainInfo {
  id: ChainType;
  name: string;
  icon: string;
  rpcUrl: string;
}

interface WalletContextType {
  currentChain: ChainType;
  setCurrentChain: (chain: ChainType) => void;
  chains: ChainInfo[];
  // Solana wallet functions
  connectSolana: () => void;
  disconnectSolana: () => void;
  isSolanaConnected: boolean;
  solanaPublicKey: string | null;
  solanaWalletName: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
};

// Custom hook for Solana wallet operations
const useSolanaWallet = () => {
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const connectSolana = () => {
    setVisible(true);
  };

  const disconnectSolana = () => {
    disconnect();
  };

  return {
    connectSolana,
    disconnectSolana,
    isSolanaConnected: connected,
    solanaPublicKey: publicKey?.toString() || null,
    solanaWalletName: wallet?.adapter?.name || null,
  };
};

interface IWalletContextProvider {
  children: ReactNode;
}

const WalletContextProvider = ({ children }: IWalletContextProvider) => {
  const [currentChain, setCurrentChain] = useState<ChainType>('solana');

  const chains: ChainInfo[] = [
    { 
      id: 'solana', 
      name: 'Solana', 
      icon: '/chains/solana.svg',
      rpcUrl: clusterApiUrl(getSOLNetwork())
    },
    { 
      id: 'near', 
      name: 'NEAR', 
      icon: '/chains/near.png',
      rpcUrl: 'https://rpc.testnet.near.org'
    },
    { 
      id: 'evm', 
      name: 'Ethereum', 
      icon: '/chains/ethereum.png',
      rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    }
  ];

  const wallets = React.useMemo(
    () => [
      new walletAdapterWallets.PhantomWalletAdapter(),
      new walletAdapterWallets.SolflareWalletAdapter(),
      new walletAdapterWallets.TorusWalletAdapter(),
      new walletAdapterWallets.AlphaWalletAdapter(),
    ],
    [getSOLNetwork()]
  );

  const endpoint = useMemo(() => clusterApiUrl(getSOLNetwork()), [getSOLNetwork()]);

  const contextValue = useMemo(() => ({
    currentChain,
    setCurrentChain,
    chains,
    // Placeholder values for Solana wallet functions
    connectSolana: () => {},
    disconnectSolana: () => {},
    isSolanaConnected: false,
    solanaPublicKey: null,
    solanaWalletName: null,
  }), [currentChain, chains]);

  return (
    <WalletContext.Provider value={contextValue}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={true}>
          <WalletModalProvider>
            <SolanaWalletWrapper>
              {children}
            </SolanaWalletWrapper>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </WalletContext.Provider>
  );
};

// Wrapper component to provide Solana wallet functions
const SolanaWalletWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const solanaWallet = useSolanaWallet();
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('SolanaWalletWrapper must be used within WalletContextProvider');
  }

  const enhancedContextValue = {
    ...context,
    ...solanaWallet,
  };

  return (
    <WalletContext.Provider value={enhancedContextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContextProvider;