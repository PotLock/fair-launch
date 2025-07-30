import "@near-wallet-selector/modal-ui/styles.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import React from "react";
import Header from "../components/layout/Header";
import WalletContextProvider from "../context/WalletProviderContext";
import { WalletSelectorProvider } from "../components/NearWalletProvider";
import { nearWalletConfig } from "../configs/nearWalletConfig";
import { Toaster } from "react-hot-toast";
import { InforWarning } from "../components/layout/InforWarning";
import { Footer } from "../components/layout/Footer";
import { HelpButton } from "../components/layout/HelpButton";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

export const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WalletSelectorProvider config={nearWalletConfig}>
          <WalletContextProvider>
            <Header />
            <InforWarning/>
            <Outlet />
            <Footer/>
            <HelpButton />
            <TanStackRouterDevtools position="bottom-right" />
            <Toaster position="top-right" />
          </WalletContextProvider>
        </WalletSelectorProvider>
      </QueryClientProvider>
    </>
  );
}

export default RootComponent;
