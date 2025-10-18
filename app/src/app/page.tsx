import { Suspense } from "react";
import Comprehensive from "@/components/home/Comprehensive";
import ConsultUs from "@/components/home/ConsultUs";
import CoreCapabilities from "@/components/home/CoreCapabilities";
import IntegratedEcosystem from "@/components/home/IntegratedEcosystem";
import Hero from "@/components/layout/Hero";
import HeroClient from "@/components/layout/HeroClient";
import ExploreTokens from "@/components/home/ExploreTokens";
import ExploreTokensLoading from "@/components/home/ExploreTokensLoading";
import TokenCount from "@/components/home/TokenCount";


export default function Home() {
  return (
    <HeroClient>
      <div className="min-h-screen py-10">
        <Hero/>
        <section className="w-full bg-neutral-100 h-28 flex items-center justify-center home-partners overflow-hidden">
          <div className="w-full lg:container px-6 lg:px-28 mx-auto">
            <div className="marquee2">
              <div className="marquee2__track">
                <div className="flex gap-1 items-center flex-shrink-0">
                  <img src="/logos/near-intents.svg" alt="near-intents" className="w-28 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0">
                  <img src="/logos/aerodrome.png" alt="Aerodrome" className="w-8 h-auto" />
                  <span className="text-lg font-bold">AERODROME</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0">
                  <img src="/logos/raydium-text.svg" alt="Raydium" className="w-36 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0">
                  <img src="/logos/pumpfun.png" alt="PumpSwap" className="w-9 h-auto" />
                  <span className="font-bold">PumpSwap</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0">
                  <img src="/logos/rhea.svg" alt="RHEA" className="w-[6rem] h-auto" />
                </div>

                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/near-intents.svg" alt="near-intents" className="w-28 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/aerodrome.png" alt="Aerodrome" className="w-8 h-auto" />
                  <span className="text-lg font-bold">AERODROME</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/raydium-text.svg" alt="Raydium" className="w-36 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/pumpfun.png" alt="PumpSwap" className="w-9 h-auto" />
                  <span className="font-bold">PumpSwap</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/rhea.svg" alt="RHEA" className="w-[6rem] h-auto" />
                </div>

                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/near-intents.svg" alt="near-intents" className="w-28 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/aerodrome.png" alt="Aerodrome" className="w-8 h-auto" />
                  <span className="text-lg font-bold">AERODROME</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/raydium-text.svg" alt="Raydium" className="w-36 h-auto" />
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/pumpfun.png" alt="PumpSwap" className="w-9 h-auto" />
                  <span className="font-bold">PumpSwap</span>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0" aria-hidden="true">
                  <img src="/logos/rhea.svg" alt="RHEA" className="w-[6rem] h-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="lg:container px-4 lg:px-6 mx-auto pt-10 md:pt-20">
          <div className="grid grid-cols-2 gap-3 md:flex items-center md:justify-between md:px-6 home-stats">
            <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
              <span className="font-bold text-4xl">10+</span>
              <span className="font-thin text-base md:text-lg">PLANNED PROJECT LAUNCHES</span>
            </div>
            <div className="h-[130px] md:w-[300px] p-2 md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
              <TokenCount />
              <span className="font-thin text-base md:text-lg">TOKENS CREATED</span>
            </div>
            <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
              <span className="font-bold text-4xl">4+</span>
              <span className="font-thin text-base md:text-lg">CHAINS SUPPORTED</span>
            </div>
          </div>
          <CoreCapabilities/>
          
          {/* Stream the ExploreTokens component with Suspense */}
          <Suspense fallback={<ExploreTokensLoading />}>
            <ExploreTokens/>
          </Suspense>
          
          <Comprehensive/>
          <IntegratedEcosystem/>
          <ConsultUs/>
        </div>
      </div>
    </HeroClient>
  );
}
