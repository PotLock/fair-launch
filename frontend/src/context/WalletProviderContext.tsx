import React, { ReactNode, useMemo, createContext, useContext, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import * as walletAdapterWallets from "@solana/wallet-adapter-wallets";
import { solNetwork } from "../utils/sol";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
};

interface IWalletContextProvider {
  children: ReactNode;
}

// Configure wagmi with proper EVM chains
const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, base],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/your-api-key'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/your-api-key'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [base.id]: http('https://mainnet.base.org'),
  },
});

const queryClient = new QueryClient();

const WalletContextProvider = ({ children }: IWalletContextProvider) => {
  const [currentChain, setCurrentChain] = useState<ChainType>('solana');

  const chains: ChainInfo[] = [
    { 
      id: 'solana', 
      name: 'Solana', 
      icon: '/chains/solana.svg',
      rpcUrl: clusterApiUrl(solNetwork())
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
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
    }
  ];

  const wallets = React.useMemo(
    () => [
      new walletAdapterWallets.PhantomWalletAdapter(),
      new walletAdapterWallets.SolflareWalletAdapter(),
      new walletAdapterWallets.TorusWalletAdapter(),
      new walletAdapterWallets.AlphaWalletAdapter(),
    ],
    [solNetwork()]
  );

  const endpoint = useMemo(() => clusterApiUrl(solNetwork()), [solNetwork()]);


  const contextValue = useMemo(() => ({
    currentChain,
    setCurrentChain,
    chains
  }), [currentChain, chains]);

  return (
    <WalletContext.Provider value={contextValue}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                  {children}
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </WalletContext.Provider>
  );
};

export default WalletContextProvider;