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
import useAnchorProvider from "../../hook/useAnchorProvider";
import { useEffect } from "react";

export const TokenContainer = () => {
    const { deployToken } = useDeployToken();
    const { publicKey } = useWallet();
    const router = useRouter();
    const { 
        basicInfo,
        socials, 
        allocation, 
        dexListing, 
        saleSetup, 
        adminSetup,
        fees
     } = useDeployStore();
    const navigate = useNavigate();
    const { resetState } = useDeployStore.getState();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [txid, setTxid] = useState<string>("");
    const provider = useAnchorProvider();
    const [activeStep, setActiveStep] = useState('basicInfo');

    // Define the order and keys of steps
    const steps = [
        { key: 'basicInfo', component: BasicInformation },
        { key: 'social', component: Social },
        { key: 'distribution', component: TokenDistribution },
        { key: 'pricing', component: PricingMechanism },
        { key: 'dex', component: DEXListing },
        { key: 'fees', component: FeesStep },
        { key: 'sale', component: TokenSaleSetup },
        { key: 'admin', component: AdminSetup },
        { key: 'review', component: ReviewAndDeploy },
    ];

    useEffect(() => {
        if (isSuccess) {
            handleViewToken();
        }
    }, [isSuccess, txid]);

    const handleDeployToken = async () => {
        if (!publicKey) {
            toast.error("Please connect your wallet first!");
            return;
        }

        // Check SOL balance before deploying
        if (provider && provider.connection && publicKey) {
            try {
                const balanceLamports = await provider.connection.getBalance(publicKey);
                const balanceSol = balanceLamports / 1e9;
                if (balanceSol < 0.001) {
                    toast.error("Insufficient SOL balance. You need at least 0.001 SOL to deploy a token.");
                    return;
                }
            } catch (err) {
                toast.error("Failed to check wallet balance.");
                return;
            }
        }

        if(!basicInfo.name && !basicInfo.symbol && !basicInfo.description && !basicInfo.decimals && !basicInfo.avatarUrl && !basicInfo.bannerUrl) {
            toast.error("Please fill in all required fields in Basic Information");
            return;
        }

        if(!socials.twitter && !socials.telegram && !socials.discord && !socials.farcaster && !socials.website){
            toast.error("At least one social media or website is required")
            return;
        }

        if(!allocation[0].description && !allocation[0].lockupPeriod && !allocation[0].percentage && !allocation[0].vesting && !allocation[0].walletAddress){
            toast.error("Please fill in all the required fields in Allocation")
        }

        if(!dexListing.walletLiquidityAmount && !dexListing.liquidityPercentage && !dexListing.liquidityLockupPeriod){
            toast.error("Please fill in all the required fields in DEX Listing")
        }
        
        if(!fees.feeRecipientAddress){
            toast.error("Please fill in all the required fields in Fee Configuration")
        }
        
        if(!saleSetup.softCap && !saleSetup.hardCap && !saleSetup.scheduleLaunch && !saleSetup.maximumContribution && !saleSetup.minimumContribution){
            toast.error("Please fill in all the required fields in Token Sale Setup")
        }

        if(!adminSetup.adminWalletAddress){
            toast.error("Please fill in all the required fields in Admin Setup")
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
        resetState();
        navigate({ to: "/my-tokens" });
        // Navigate to token page or open in explorer
        if (txid) {
            window.open(`https://solscan.io/tx/${txid}?cluster=devnet`, '_blank');
        }
    };

    const handleReturnHome = () => {
        setIsSuccess(false);
        resetState();
        router.navigate({ to: "/" });
    };

    return (
        <div className="flex flex-col gap-2 w-full pb-10 max-w-2xl mx-auto">
            <div className="flex flex-col gap-2 text-center mb-10">
                <h1 className="text-2xl md:text-3xl font-bold">Token Creation</h1>
                <p className="text-sm md:text-base text-gray-500">Easily create and mint your own SPL Token without coding</p>
            </div>
            {steps.map((step, idx) => {
                const StepComponent = step.component;
                return (
                    <StepComponent
                        key={step.key}
                        isExpanded={activeStep === step.key}
                        stepKey={step.key}
                        onHeaderClick={setActiveStep}
                    />
                );
            })}
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
                onClose={() => setIsSuccess(false)}
            />
        </div>
    );
}