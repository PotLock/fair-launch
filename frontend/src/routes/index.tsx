import { createFileRoute } from "@tanstack/react-router";
import TokenDeployer from "../components/tokenDeployer/TokenDeployerPage";
import { TokenDeployerProvider } from "../context/TokenDeployerContext";

export const Route = createFileRoute("/")({
  component: TokenDeployerPage,
});

function TokenDeployerPage() {
  return (
    <TokenDeployerProvider>
      <TokenDeployer />
    </TokenDeployerProvider>
  );
};
