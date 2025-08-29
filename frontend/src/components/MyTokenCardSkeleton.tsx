import { Skeleton } from "./ui/skeleton";

export const MyTokenCardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl border-[1.5px] border-gray-200 overflow-hidden p-4 md:max-w-[365px] shadow-sm">
            <div className="relative">
                <Skeleton className="w-full h-48 rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-1" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-2 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                    <div className="absolute top-0 right-6">
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="relative mt-2">
                <div className="mb-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="grid grid-cols-3 md:gap-4 mt-6">
                    <div className="text-center flex flex-col">
                        <Skeleton className="h-5 w-20 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="text-center flex flex-col">
                        <Skeleton className="h-5 w-16 mx-auto mb-1" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                    <div className="text-center flex flex-col">
                        <Skeleton className="h-5 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                </div>

                <div className="flex gap-10 mt-8">
                    <Skeleton className="flex-1 h-8 rounded-md" />
                    <Skeleton className="flex-1 h-8 rounded-md" />
                </div>
            </div>
        </div>
    );
};
