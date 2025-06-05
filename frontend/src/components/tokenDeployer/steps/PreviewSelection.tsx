export const PreviewSelection = () => {
    return (
        <div className="w-full">
            {/* Header Section */}
            <div className="flex justify-between mb-6">
                {/* Token Template */}
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-gray-400 text-sm font-medium mb-1">Token Template</span>
                    <div className="flex items-center gap-2">
                        <img src="/icons/meme-token.svg" alt="Rocket" className="w-6 h-6 mr-1" />
                        <span className="font-bold text-base">Meme Coin</span>
                    </div>
                </div>
                {/* Launch Type */}
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-gray-400 text-sm font-medium mb-1">Launch Type</span>
                    <span className="font-bold text-base">Fair Launch</span>
                </div>
                {/* Pricing Mechanism */}
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-gray-400 text-sm font-medium mb-1">Pricing Mechanism</span>
                    <span className="font-bold text-base">Fixed Price</span>
                </div>
            </div>
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="font-semibold text-sm mb-1">What happens next?</div>
                <div className="text-gray-700 text-xs">
                    After confirming your selection, you'll be able to customize detailed settings for your token, including supply, allocations, vesting schedules, and more specific parameters for your chosen launch type and pricing mechanism.
                </div>
            </div>
        </div>
    );
}