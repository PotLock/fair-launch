import { createFileRoute } from "@tanstack/react-router";
import TokenDeployer from "../components/tokenDeployer/TokenDeployerPage";

export const Route = createFileRoute("/")({
  component: TokenDeployer,
});
