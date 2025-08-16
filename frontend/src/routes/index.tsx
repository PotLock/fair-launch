import { createFileRoute } from "@tanstack/react-router";
import Hero from "../components/layout/Hero";
import CoreCapabilities from "../components/CoreCapabilities";
import ExploreTokens from "../components/ExploreTokens";
import Comprehensive from "../components/Comprehensive";
import IntegratedEcosystem from "../components/IntegratedEcosystem";
import ConsultUs from "../components/ConsultUs";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {

  return (
    <div className="min-h-screen py-10">
      <Hero/>
      <section className="w-full bg-neutral-100 h-28 flex items-center justify-center">
        <div className="w-full container px-6 md:px-28 mx-auto flex items-center justify-start md:justify-between gap-8 overflow-x-auto">
          <div className="flex gap-1 items-center flex-shrink-0">
            <img src="/logos/relydotcash.png" alt="RelaydotCash" className="w-10 h-10" />
            <span className="text-neutral-500 text-base font-bold whitespace-nowrap">reply.cash</span>
          </div>
          <div className="flex gap-1 items-center flex-shrink-0">
            <img src="/logos/POTLOCK.svg" alt="Potlock" className="w-8 h-8" />
            <span className="text-neutral-500 text-base font-bold whitespace-nowrap">POTLOCK</span>
          </div>
          <div className="flex gap-1 items-center flex-shrink-0">
            <img src="/logos/usersdotfun.png" alt="Usersdotfun" className="w-10 h-10" />
            <span className="text-neutral-500 text-base font-bold whitespace-nowrap">Users.fun</span>
          </div>
          <div className="flex gap-1 items-center flex-shrink-0">
            <img src="/logos/curatedotfun.svg" alt="Curatedotfun" className="w-7 h-7" />
            <span className="text-neutral-500 text-base font-bold whitespace-nowrap">Curate.fun</span>
          </div>
          <div className="flex gap-1 items-center flex-shrink-0">
            <img src="/logos/arrestdotfun.png" alt="Arrestdotfun" className="w-7 h-7" />
            <span className="text-neutral-500 text-base font-bold whitespace-nowrap">Arrest.fun</span>
          </div>
        </div>
      </section>
      <div className="container px-6 mx-auto pt-10 md:pt-20">
        <div className="grid grid-cols-2 gap-3 md:flex items-center md:justify-between md:px-10">
          <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center">
            <span className="font-bold text-4xl">X</span>
            <span className="font-thin text-base md:text-lg">TOTAL VALUE LAUNCHED</span>
          </div>
          <div className="h-[130px] md:w-[300px] p-2 md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center">
            <span className="font-bold text-4xl">X</span>
            <span className="font-thin text-base md:text-lg">TOKENS CREATED</span>
          </div>
          <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center">
            <span className="font-bold text-4xl">4+</span>
            <span className="font-thin text-base md:text-lg">CHAINS SUPPORTED</span>
          </div>
        </div>
        <CoreCapabilities/>
        <ExploreTokens/>
        <Comprehensive/>
        <IntegratedEcosystem/>
        <ConsultUs/>
      </div>
    </div>
  );
}