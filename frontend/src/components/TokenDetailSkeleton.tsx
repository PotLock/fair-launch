import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

export const TokenDetailSkeleton = () => {
    return (
        <div className="min-h-screen container mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 col-span-2 space-y-4">
                {/* Banner and Header Skeleton */}
                <div className="relative">
                    <div className="relative">
                        <Skeleton className="w-full h-64 rounded-lg" />
                        <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                            style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
                    </div>
                    <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-20 h-20 rounded-xl border-[3px] border-white shadow-md bg-white" />
                            <div className="flex flex-col">
                                <Skeleton className="h-8 w-32 mb-2" />
                                <div className="flex items-center gap-2 mt-2">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 mr-10 md:mr-14">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="w-6 h-6 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Presale Card Skeleton */}
                <div className="border border-gray-200 rounded-lg max-h-[780px] bg-gray-50 relative pb-5 block md:hidden">
                    <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="w-3 h-3 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="ml-auto h-6 w-24 rounded-md" />
                        </div>

                        <Skeleton className="h-8 w-32 mb-3" />

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                            <Skeleton className="h-2 rounded-full w-[60%]" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i}>
                                    <Skeleton className="h-6 w-16 mb-1" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <Skeleton className="h-4 w-16 mb-2" />
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                            </div>
                            <Skeleton className="h-4 w-16 mt-1" />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                            </div>
                            <Skeleton className="h-4 w-16 mt-1" />
                        </div>

                        <Skeleton className="w-full h-12 rounded-lg mb-4" />
                    </div>
                    <div className="p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg mt-4">
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>

                {/* Description Card Skeleton */}
                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <Skeleton className="h-6 w-24 mb-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </Card>

                {/* Tokenomics Card Skeleton */}
                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 gap-3 mt-5 border-b border-gray-200 pb-4">
                        <div className="flex flex-col gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mt-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex flex-row gap-2 items-center">
                            <Skeleton className="w-6 h-6" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="w-4 h-4 rounded-full" />
                        </div>
                    </div>
                </Card>

                {/* Allocation Card Skeleton */}
                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="flex justify-center bg-gray-100/60 rounded-lg py-2 md:py-4">
                        <Skeleton className="w-full max-w-xs md:max-w-md h-[250px] rounded-lg" />
                    </div>
                    <div className="w-full overflow-x-auto mt-6">
                        <div className="w-full min-w-[800px]">
                            <div className="border-b border-gray-200 py-3">
                                <div className="grid grid-cols-5 gap-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-4 w-16" />
                                    ))}
                                </div>
                            </div>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="border-b border-gray-100 last:border-0 py-4">
                                    <div className="grid grid-cols-5 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="w-3 h-3 rounded-sm" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                        <Skeleton className="h-4 w-8" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Vesting Schedule Card Skeleton */}
                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="w-full h-[220px] md:h-[320px] rounded-lg" />
                </Card>

                {/* Bonding Curve Card Skeleton */}
                <Card className="p-4 md:p-6 shadow-none">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="mb-6 w-full h-[220px] md:h-[320px]">
                        <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i}>
                                <Skeleton className="h-4 w-20 mb-1" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </Card>
            </div>
            
            {/* Desktop Presale Card Skeleton */}
            <div className="border border-gray-200 rounded-lg max-h-[730px] bg-gray-50 relative hidden md:block">
                <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                    <div className="flex items-center gap-2 mb-4">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="ml-auto h-6 w-24 rounded-md" />
                    </div>

                    <Skeleton className="h-8 w-32 mb-3" />

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                        <Skeleton className="h-2 rounded-full w-[60%]" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i}>
                                <Skeleton className="h-6 w-16 mb-1" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                        <Skeleton className="h-4 w-16 mt-1" />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                        <Skeleton className="h-4 w-16 mt-1" />
                    </div>

                    <Skeleton className="w-full h-12 rounded-lg mb-4" />
                </div>
                <div className="absolute bottom-5 left-0 right-0 p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg">
                    <Skeleton className="h-3 w-full" />
                </div>
            </div>
        </div>
    );
}; 