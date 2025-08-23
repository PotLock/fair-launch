import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/bridge")({
    component: Bridge,
});

function Bridge() {
    return <div>Bridge</div>;
}