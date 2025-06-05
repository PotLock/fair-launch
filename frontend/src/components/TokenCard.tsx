import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface TokenCardProps {
    image: string;
    avatar: string;
    name: string;
    symbol: string;
    type: string;
    description: string;
    progress: number;
    progressLabel: string;
    address: string;
    createdOn: string;
    marketCap: string;
    price: string;
    externalLabel: string;
    externalIcon?: React.ReactNode;
}

export function TokenCard({
    image,
    avatar,
    name,
    symbol,
    type,
    description,
    progress,
    progressLabel,
    address,
    createdOn,
    marketCap,
    price,
    externalLabel,
    externalIcon,
}: TokenCardProps) {
    return (
        <Card className="rounded-3xl border-2 border-gray-200 bg-white p-0 overflow-hidden transition hover:shadow-lg">
            <div className="relative p-3">
                <div className="relative">
                    <img src={image} alt={name} className="w-full h-48 object-cover rounded-2xl" />
                    <div className="absolute left-0 bottom-0 w-full h-48 rounded-b-2xl pointer-events-none"
                        style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'}} />
                    </div>
                    <div className="absolute left-5 bottom-6 flex items-center gap-3 flex-row justify-between w-full">
                    <img src={avatar} alt={name} className="w-14 h-14 rounded-full border-2 object-cover border-white shadow-md bg-white" />
                    <div className="flex flex-col mr-12">
                        <span className="text-xl font-bold text-white uppercase">{name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-white">${symbol}</span>
                            <Badge variant="default" className="bg-green-500 text-white border-white border text-xs px-2 py-0.5 rounded-full">{type}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        <CardContent className="pt-14 p-3">
            {/* Description */}
            <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">{description}</p>
            {/* Progress Row */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Token Type</span>
                <span>{progressLabel}</span>
            </div>
            <Progress value={progress} className="h-4 bg-gray-200 mb-4" />
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                <div>
                    <div className="text-gray-400">Token Address</div>
                    <div className="font-medium text-gray-800 truncate">{address}</div>
                </div>
                <div className="text-right">
                    <div className="text-gray-400">Created On</div>
                    <div className="font-medium text-gray-800">{createdOn}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div>
                    <div className="text-gray-400">Market Cap</div>
                    <div className="font-bold text-gray-900">{marketCap}</div>
                </div>
                <div className="text-right">
                    <div className="text-gray-400">Price</div>
                    <div className="font-bold text-gray-900">{price}</div>
                </div>
            </div>
            {/* Buttons */}
            <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1 rounded-md text-sm border-gray-300 py-2">View Details</Button>
                <Button variant="secondary" className="flex-1 flex items-center text-sm gap-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white py-2">
                    {externalIcon}
                    {externalLabel}
                </Button>
            </div>
        </CardContent>
        </Card>
    );
} 