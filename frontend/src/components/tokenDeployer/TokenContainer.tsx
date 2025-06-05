import { BasicInformation } from "./steps/BasicInformation";
import { Social } from "./steps/Social";
import { TokenDistribution } from "./steps/TokenDistribution";
import { DEXListing } from "./steps/DEXListing";
import Fees from "./steps/Fees";

export const TokenContainer = () => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col gap-2 text-center mb-10">
                <h1 className="text-2xl font-bold">Token Creation</h1>
                <p className="text-sm text-gray-500">Easily create and mint your own SPL Token without coding</p>
            </div>
            <BasicInformation />
            <Social />
            <TokenDistribution />
            <DEXListing />
            <Fees />
        </div>
    );
}