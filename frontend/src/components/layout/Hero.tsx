import { ArrowRight,BookA } from "lucide-react";
import { Button } from "../ui/button";

export default function Hero() {
  return (
    <div className="bg-white">
      <div className="container px-6 mx-auto -mt-10 font-sora">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-black text-lg font-light flex gap-1">
              The <img src="/icons/world.svg" alt="world" className="w-6 h-6" /> Internet Capital Markets toolkit
            </div>
            
            <div className="text-5xl flex flex-col gap-1 lg:text-6xl font-bold text-black leading-tight">
              <span>Launch Tokens</span>
              <span>Across Multiple</span>
              <span>Chains</span>
            </div>
            
            <p className="text-sm text-black font-light leading-relaxed md:max-w-[550px]">
              Create, bridge, and launch tokens across{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <img src="/logos/solana_light.svg" alt="SOLANA" className="w-4 h-4" />
                </span>
                <span>Solana</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <img src="/chains/near_light.svg" alt="NEAR" className="w-4 h-4" />
                </span>
                <span>NEAR</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <img src="/chains/base.svg" alt="BASE" className="w-4 h-4" />
                </span>
                <span>BASE</span>
              </span>
              {" "}and{" "}
              <span className="inline-flex items-center space-x-1 border p-1 rounded-full border-dashed border-gray-400">
                <span className="w-6 h-6 border border-gray-700 rounded-full flex items-center justify-center">
                  <img src="/chains/ethereum.svg" alt="ETH" className="w-6 h-6" />
                </span>
                <span>Ethereum</span>
              </span>
              {"  "}networks with our comprehensive no-code platform. <span className="text-gray-500 font-light">Launch in minutes, not months.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-[#DD3345] hover:bg-red-700 text-white px-8 py-5 text-sm rounded-md transition-colors">
                <span className="font-light">Launch Your Token</span> 
                <ArrowRight className="w-4 h-4"/>
              </Button>
              <Button variant="outline" className="border-none bg-[#eaf0f6] text-black px-8 py-5 text-sm font-normal rounded-md hover:bg-[#f2f6f9] transition-colors">
                <span className="font-light">View Documentation</span>
                <BookA className="w-6 h-6"/>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-end mt-5">
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