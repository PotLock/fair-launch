import { createFileRoute } from "@tanstack/react-router";
import { BridgeExample } from "../components/BridgeExample";

export const Route = createFileRoute("/test")({
    component: Test,
});

function Test() {
    return <BridgeExample />;
}