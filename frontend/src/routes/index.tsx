import { createFileRoute } from "@tanstack/react-router";
import Hero from "../components/layout/Hero";
import CoreCapabilities from "../components/CoreCapabilities";
import ExploreTokens from "../components/ExploreTokens";
import Comprehensive from "../components/Comprehensive";
import IntegratedEcosystem from "../components/IntegratedEcosystem";
import ConsultUs from "../components/ConsultUs";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { TokenInfo } from "../utils/token";
import { getTokens } from "../lib/api";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
      const fetchTokens = async () => {
        try {
          setLoading(true);
          const tokens = await getTokens();
          setTokens(tokens.data);
        } catch (error) {
          console.error('Error fetching tokens:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchTokens();
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from('.home-stats .stat-card', {
        y: 24,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.home-stats',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen py-10" ref={rootRef}>
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
      <div className="lg:container px-5 lg:px-6 mx-auto pt-10 md:pt-20">
        <div className="grid grid-cols-2 gap-3 md:flex items-center md:justify-between md:px-6 home-stats">
          <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
            <span className="font-bold text-4xl">10+</span>
            <span className="font-thin text-base md:text-lg">PLANNED PROJECT LAUNCHES</span>
          </div>
          <div className="h-[130px] md:w-[300px] p-2 md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
            <span className="font-bold text-4xl">{loading ? "X" : tokens.length}</span>
            <span className="font-thin text-base md:text-lg">TOKENS CREATED</span>
          </div>
          <div className="h-[130px] md:w-[300px] p-2 text-center md:p-6 border rounded-lg border-gray-200 flex flex-col justify-center gap-3 items-center stat-card">
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