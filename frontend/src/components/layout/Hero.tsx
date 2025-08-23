import { ArrowRight,BookA } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Hero() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.5 })
        .from(".hero-headlines span", { y: 30, opacity: 0, stagger: 0.08, duration: 0.6 }, "-=0.2")
        .from(".hero-paragraph", { y: 20, opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".hero-cta > *", { y: 10, opacity: 0, stagger: 0.1, duration: 0.4 }, "-=0.2");

      gsap.from(".hero-image", {
        yPercent: 10,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.to(".hero-image", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=400",
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white" ref={rootRef}>
      <div className="lg:container px-6 mx-auto -mt-10 font-sora mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-2 mt-4 md:space-y-4">
            <div className="text-black text-sm md:text-lg font-light flex gap-1 hero-eyebrow">
              The <img src="/icons/world.svg" alt="world" className="w-6 h-6" /> Internet Capital Markets toolkit
            </div>
            
            <div className="text-3xl md:text-4xl flex flex-col gap-1 lg:text-5xl xl:text-6xl font-bold text-black leading-tight hero-headlines">
              <span>Launch Tokens</span>
              <span className="inline md:hidden">Across Multiple Chain</span>
              <span className="hidden md:inline">Across Multiple</span>
              <span className="hidden md:inline">Chains</span>
            </div>
            
            <p className="text-sm text-black font-light leading-relaxed md:max-w-[550px] hero-paragraph">
              Create, bridge, and launch tokens across{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-4 h-4 md:w-6 md:h-6 bg-black rounded-full flex items-center justify-center">
                  <img src="/logos/solana_light.svg" alt="SOLANA" className="w-3 h-3 md:w-4 md:h-4" />
                </span>
                <span className="text-xs md:text-base">Solana</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-4 h-4 md:w-6 md:h-6 bg-black rounded-full flex items-center justify-center">
                  <img src="/chains/near_light.svg" alt="NEAR" className="w-3 h-3 md:w-4 md:h-4" />
                </span>
                <span className="text-xs md:text-base">NEAR</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <img src="/chains/base.svg" alt="BASE" className="w-3 h-3 md:w-4 md:h-4" />
                </span>
                <span className="text-xs md:text-base">BASE</span>
              </span>
              {" "}and{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-4 h-4 md:w-6 md:h-6 border border-gray-700 rounded-full flex items-center justify-center">
                  <img src="/chains/ethereum.svg" alt="ETH" className="w-3 h-3 md:w-4 md:h-4" />
                </span>
                <span className="text-xs md:text-base">Ethereum</span>
              </span>
              {"  "}networks with our comprehensive no-code platform. <span className="text-gray-500 font-light">Launch in minutes, not months.</span>
            </p>
            
            <div className="flex flex-row gap-2 md:gap-4 pt-4 md:pt-0 hero-cta">
              <Button onClick={() => navigate({to: "/create"})} className="bg-[#DD3345] hover:bg-red-700 text-white p-2 px-3 md:px-8 md:py-5 text-xs md:text-sm rounded-md transition-colors">
                <span className="font-light">Launch Your Token</span> 
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4"/>
              </Button>
              <Button onClick={() => window.open("https://docs.potlaunch.com", "_blank")} variant="outline" className="border-none bg-[#eaf0f6] text-black p-2 px-3 md:px-8 md:py-5 text-xs md:text-sm font-normal rounded-md hover:bg-[#f2f6f9] transition-colors">
                <span className="font-light">View Documentation</span>
                <BookA className="w-3 h-3 md:w-4 md:h-4"/>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <img 
              src="/hero.png" 
              alt="Token Launch Illustration" 
              className="lg:w-full w-[26rem] h-[26rem] lg:max-w-lg lg:h-auto object-contain hero-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 