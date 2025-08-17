import { createFileRoute } from "@tanstack/react-router";
import TokenDeployer from "../components/token-deployer/TokenDeployerPage";

export const Route = createFileRoute("/create")({
  component: TokenDeployer,
});
