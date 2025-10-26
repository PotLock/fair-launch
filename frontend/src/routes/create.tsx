import { createFileRoute } from "@tanstack/react-router";
import { useMetadata } from "../hook/useMetadata";
import CreateToken from "../components/create-token";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  useMetadata({
    title: "Create Token - POTLAUNCH",
    description: "Create and launch your own token on POTLAUNCH. Deploy tokens with bonding curves, vesting schedules, and multi-chain support.",
    imageUrl: "/og-image.png"
  });

  return(
    <div className="pt-5">
      <CreateToken />
    </div>
  );
}
