import { ArrowRight,BookA } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "@tanstack/react-router";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <div className="container px-6 mx-auto -mt-10 font-sora mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-2 mt-4 md:space-y-4">
            <div className="text-black text-sm md:text-lg font-light flex gap-1">
              The <img src="/icons/world.svg" alt="world" className="w-6 h-6" /> Internet Capital Markets toolkit
            </div>
            
            <div className="text-3xl md:text-5xl flex flex-col gap-1 lg:text-6xl font-bold text-black leading-tight">
              <span>Launch Tokens</span>
              <span className="inline md:hidden">Across Multiple Chain</span>
              <span className="hidden md:inline">Across Multiple</span>
              <span className="hidden md:inline">Chains</span>
            </div>
            
            <p className="text-sm text-black font-light leading-relaxed md:max-w-[550px]">
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
            
            <div className="flex flex-row gap-2 md:gap-4 pt-4 md:pt-0">
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
          
          <div className="flex justify-center lg:justify-end">
            <img 
              src="/hero.png" 
              alt="Token Launch Illustration" 
              className="w-full max-w-lg h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 