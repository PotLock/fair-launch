import { PreviewTokenCard } from "../PreviewTokenCard";
import { TokenContainer } from "../TokenContainer";

export const TokenCreation = () => {
    return (
        <div className="grid grid-cols-2 gap-10 w-full relative">
            <div className="h-screen w-full border-r border-gray-200 relative flex justify-center">
                <PreviewTokenCard progress={50} />
            </div>
            <TokenContainer />
        </div>
    );
}