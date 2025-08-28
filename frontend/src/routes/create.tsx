import { createFileRoute } from "@tanstack/react-router";
import TokenDeployer from "../components/token-deployer/TokenDeployerPage";
import { useMetadata } from "../hook/useMetadata";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  useMetadata({
    title: "Create Token - POTLAUNCH",
    description: "Create and launch your own token on POTLAUNCH. Deploy tokens with bonding curves, vesting schedules, and multi-chain support.",
    imageUrl: "/og-image.png"
  });

  return <TokenDeployer />;
}
