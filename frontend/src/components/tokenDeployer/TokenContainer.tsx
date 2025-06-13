import { BasicInformation, Social, TokenDistribution, DEXListing, FeesStep, TokenSaleSetup, AdminSetup, ReviewAndDeploy, PricingMechanism } from "./steps";
import { Fuel } from "lucide-react";
import { useDeployToken } from "../../hook/useDeployToken";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";

export const TokenContainer = () => {
    const { deployToken } = useDeployToken();
    const { publicKey } = useWallet();

    const handleDeployToken = async () => {
        if (!publicKey) {
            toast.error("Please connect your wallet first!");
            return;
        }
        try {
            await deployToken();
        } catch (error) {
            console.error("Deploy token error:", error);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full pb-10">
            <div className="flex flex-col gap-2 text-center mb-10">
                <h1 className="text-2xl font-bold">Token Creation</h1>
                <p className="text-sm text-gray-500">Easily create and mint your own SPL Token without coding</p>
            </div>
            <BasicInformation />
            <Social />
            <TokenDistribution />
            <PricingMechanism />
            <DEXListing />
            <FeesStep />
            <TokenSaleSetup />
            <AdminSetup />
            <ReviewAndDeploy />
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 flex flex-row justify-between items-center">
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Estimated Deployment Cost</label>
                    <div className="flex flex-row gap-1 items-center">
                        <Fuel className="w-4 h-4" />
                        <span className="font-semibold">0.0005 SOL</span>
                        <span>≈</span>
                        <span>$0.75 USD</span>
                    </div>
                </div>
                <button 
                    onClick={handleDeployToken}
                    className="border p-2 px-3 bg-gray-100 rounded-md text-sm border-gray-300 shadow-none hover:bg-gray-200 transition-colors"
                >
                    Deploy Token
                </button>
            </div>
        </div>
    );
}