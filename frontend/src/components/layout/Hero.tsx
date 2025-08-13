import { Button } from "../ui/button";

export default function Hero() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto -mt-10 font-sora">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-black text-lg font-light flex gap-1">
              The <img src="/icons/world.svg" alt="world" className="w-6 h-6" /> Internet Capital Markets toolkit
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-black leading-tight">
              Launch Tokens
              <br />
              Across Multiple
              <br />
              Chains
            </h1>
            
            {/* Description */}
            <p className="text-sm text-black font-light leading-relaxed md:max-w-[550px]">
              Create, bridge, and launch tokens across{" "}
              <span className="inline-flex items-center space-x-2">
                <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </span>
                <span>Solana</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-2">
                <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-green-500 text-xs font-bold">N</span>
                </span>
                <span>NEAR</span>
              </span>
              ,{" "}
              <span className="inline-flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">—</span>
                </span>
                <span>BASE</span>
              </span>
              {" "}and{" "}
              <span className="inline-flex items-center space-x-2">
                <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">◆</span>
                </span>
                <span>Ethereum</span>
              </span>
              {" "}networks with our comprehensive no-code platform. <span className="text-gray-500 font-light">Launch in minutes, not months.</span>
            </p>
            
            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-[#DD3345] hover:bg-red-700 text-white px-8 py-5 text-sm rounded-md transition-colors">
                Launch Your Token →
              </Button>
              <Button variant="outline" className="border-none bg-[#eaf0f6] text-black px-8 py-5 text-sm font-normal rounded-md hover:bg-[#f2f6f9] transition-colors">
                View Documentation
              </Button>
            </div>
          </div>
          
          {/* Right Section - Hero Image */}
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