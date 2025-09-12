import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import Header from "../components/layout/Header";
import WalletContextProvider from "../context/WalletProviderContext";
import { Toaster } from "react-hot-toast";
import { InforWarning } from "../components/layout/InforWarning";
import { Footer } from "../components/layout/Footer";
import { HelpButton } from "../components/layout/HelpButton";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { nearWalletConfig } from "../configs/nearWalletConfig";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, base } from 'wagmi/chains';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ALCHEMY_API_KEY } from "../configs/env.config";

const queryClient = new QueryClient();

// Configure wagmi with proper EVM chains
const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, base],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
    [polygon.id]: http('https://polygon-rpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [base.id]: http('https://mainnet.base.org'),
  },
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validRoutes = ['/', '/create', '/my-tokens', '/tokens', '/bridge'];
    
    const isValidRoute = validRoutes.includes(location.pathname) || location.pathname.startsWith('/token/');
    
    if (!isValidRoute) {
      navigate({ to: "/" });
    }
  }, [location.pathname, navigate]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletContextProvider>
            <WalletSelectorProvider config={nearWalletConfig}>
              <Header />
              <InforWarning/>
              <Outlet />
              <Footer/>
              <HelpButton />
              <Toaster position="top-right" />
            </WalletSelectorProvider>
          </WalletContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default RootComponent;
