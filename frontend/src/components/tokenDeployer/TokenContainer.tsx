import { BasicInformation, Social, TokenDistribution, DEXListing, FeesStep, TokenSaleSetup, AdminSetup, ReviewAndDeploy, PricingMechanism } from "./steps";
import { Fuel } from "lucide-react";
import { useDeployToken } from "../../hook/useDeployToken";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { LoadingModal } from "./LoadingModal";
import { SuccessModal } from "./SuccessModal";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useDeployStore } from "../../stores/deployStores";

export const TokenContainer = () => {
    const { deployToken } = useDeployToken();
    const { publicKey } = useWallet();
    const router = useRouter();
    const { basicInfo } = useDeployStore();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [txid, setTxid] = useState("");

    const handleDeployToken = async () => {
        if (!publicKey) {
            toast.error("Please connect your wallet first!");
            return;
        }
        
        setIsLoading(true);
        try {
            const txid = await deployToken();
            if (txid) {
                setTxid(txid);
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Deploy token error:", error);
            // toast.error("Failed to deploy token. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelDeployment = () => {
        setIsLoading(false);
        toast.error("Token deployment cancelled");
    };

    const handleViewToken = () => {
        setIsSuccess(false);
        navigate({ to: "/my-tokens" });
        // Navigate to token page or open in explorer
        if (txid) {
            window.open(`https://solscan.io/tx/${txid}?cluster=devnet`, '_blank');
        }
    };

    const handleReturnHome = () => {
        setIsSuccess(false);
        router.navigate({ to: "/" });
    };

    return (
        <div className="flex flex-col gap-2 w-full pb-10 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2 text-center mb-10">
                <h1 className="text-2xl md:text-3xl font-bold">Token Creation</h1>
                <p className="text-sm md:text-base text-gray-500">Easily create and mint your own SPL Token without coding</p>
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
                    <label className="text-xs md:text-sm font-medium">Estimated Deployment Cost</label>
                    <div className="flex flex-row gap-1 items-center">
                        <Fuel className="w-4 h-4" />
                        <span className="text-sm md:text-base font-semibold">0.0005 SOL</span>
                        <span className="text-sm md:text-base">≈</span>
                        <span className="text-sm md:text-base">$0.75 USD</span>
                    </div>
                </div>
                <button 
                    onClick={handleDeployToken}
                    disabled={isLoading}
                    className="border p-2 px-3 bg-gray-100 rounded-md text-xs md:text-sm border-gray-300 shadow-none hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Deploying..." : "Deploy Token"}
                </button>
            </div>

            {/* Loading Modal */}
            <LoadingModal 
                isOpen={isLoading} 
                onCancel={handleCancelDeployment} 
            />

            {/* Success Modal */}
            <SuccessModal 
                isOpen={isSuccess}
                tokenName={basicInfo.name || "Token"}
                onViewToken={handleViewToken}
                onReturnHome={handleReturnHome}
            />
        </div>
    );
}