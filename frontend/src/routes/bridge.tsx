import { createFileRoute } from "@tanstack/react-router";
import { useMetadata } from "../hook/useMetadata";

export const Route = createFileRoute("/bridge")({
    component: Bridge,
});

function Bridge() {
    // Metadata for bridge page
    useMetadata({
        title: "Bridge Tokens - POTLAUNCH",
        description: "Bridge your tokens across multiple chains with POTLAUNCH. Seamlessly transfer tokens between Solana, NEAR, and other supported networks.",
        imageUrl: "/og-image.png"
    });

    return <div>Bridge</div>;
}