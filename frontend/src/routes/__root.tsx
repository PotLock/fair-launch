import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import React from "react";
import Header from "../components/layout/Header";
import WalletContextProvider from "../context/WalletProviderContext";
import { Toaster } from "react-hot-toast";
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
          <Header />
          <Outlet />
          <TanStackRouterDevtools position="bottom-right" />
          <Toaster position="top-right" />
        </WalletContextProvider>
      </QueryClientProvider>
    </>
  );
}

export default RootComponent;
