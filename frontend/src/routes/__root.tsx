import "@near-wallet-selector/modal-ui/styles.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import React from "react";
import Header from "../components/layout/Header";
import WalletContextProvider from "../context/WalletProviderContext";
import { Toaster } from "react-hot-toast";
import { InforWarning } from "../components/layout/InforWarning";
import { Footer } from "../components/layout/Footer";
import { HelpButton } from "../components/layout/HelpButton";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { nearWalletConfig } from "../configs/nearWalletConfig";

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
        <WalletContextProvider>
          <WalletSelectorProvider config={nearWalletConfig}>
          <Header />
          <InforWarning/>
          <Outlet />
          <Footer/>
          <HelpButton />
          <TanStackRouterDevtools position="bottom-right" />
          <Toaster position="top-right" />
          </WalletSelectorProvider>
        </WalletContextProvider>
      </QueryClientProvider>
    </>
  );
}

export default RootComponent;
