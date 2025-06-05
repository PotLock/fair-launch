import { BasicInformation } from "./steps/BasicInformation";
import { Social } from "./steps/Social";
import { TokenDistribution } from "./steps/TokenDistribution";
import { DEXListing } from "./steps/DEXListing";
import { Fees } from "./steps/Fees";
import { TokenSaleSetup } from "./steps/TokenSaleSetup";
import { AdminSetup } from "./steps/AdminSetup";
import { Button } from "../ui/button";
import { Fuel } from "lucide-react";

export const TokenContainer = () => {
    return (
        <div className="flex flex-col gap-2 w-full pb-10">
            <div className="flex flex-col gap-2 text-center mb-10">
                <h1 className="text-2xl font-bold">Token Creation</h1>
                <p className="text-sm text-gray-500">Easily create and mint your own SPL Token without coding</p>
            </div>
            <BasicInformation />
            <Social />
            <TokenDistribution />
            <DEXListing />
            <Fees />
            <TokenSaleSetup />
            <AdminSetup />
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
                <Button variant="default" className="border border-gray-200 shadow-none">Deploy Token</Button>
            </div>
        </div>
    );
}