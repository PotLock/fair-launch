import { createFileRoute } from "@tanstack/react-router";
import Hero from "../components/layout/Hero";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {

  return (
    <div className="min-h-screen py-10">
      <Hero/>
    </div>
  );
}