interface ExploreTokenCardProps {
    id: string;
    banner: string;
    avatar: string;
    name: string;
    symbol: string;
    type: string;
    description: string;
    price: string;
    supply: string;
    holders: string;
    marketCap: string;
    status: string;
    actionButton: {
        text: string;
        variant: 'presale' | 'curve' | 'trade';
    };
}

export default function ExploreTokenCard({banner,
    avatar,
    name,
    symbol,
    type,
    description,
    price,
    supply,
    holders,
    marketCap,
    status,
    actionButton
}: ExploreTokenCardProps){
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Presale': return 'bg-orange-50 text-orange-500';
            case 'Holding': return 'bg-green-50 text-green-500';
            case 'Trading': return 'bg-green-50 text-green-500';
            default: return 'bg-blue-50 text-blue-500';
        }
    };

    const getActionButtonStyle = (variant: string) => {
        switch (variant) {
            case 'presale': return 'bg-red-500 hover:bg-red-600';
            case 'curve': return 'bg-red-500 hover:bg-red-600';
            case 'trade': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-red-500 hover:bg-red-600';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer transition-shadow p-4 max-w-[365px]">
            <div className="relative">
                <img src={banner} alt={name} className="w-full h-48 object-cover rounded-xl" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />

                <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full">
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h3 className="text-white font-bold text-lg">{name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-white/90 text-sm">${symbol}</span>
                            <span className="text-white/70 text-sm">•</span>
                            <span className="text-white/90 text-sm">{type}</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-6">
                        <span className={`${getStatusColor(status)} text-xs px-3 py-1 rounded-full font-medium`}>
                            {status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative mt-2">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {description}
                </p>

                <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="text-center flex flex-col">
                        <span className="font-bold text-gray-900">{price}</span>
                        <span className="text-gray-500 text-xs">Price</span>
                    </div>
                    <div className="text-center flex flex-col">
                        <span className="font-bold text-gray-900">{supply}</span>
                        <span className="text-gray-500 text-xs">Supply</span>
                    </div>
                    <div className="text-center flex flex-col">
                        <span className="font-bold text-gray-900">{holders}</span>
                        <span className="text-gray-500 text-xs">Holders</span>
                    </div>
                    <div className="text-center flex flex-col">
                        <span className="font-bold text-gray-900">{marketCap}</span>
                        <span className="text-gray-500 text-xs">
                            {type === 'Bonding Curve' ? 'Curve' : 'Market Cap'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-10 mt-8">
                    <button className="flex-1 bg-white border border-gray-300 text-gray-800 py-1.5 px-2 rounded-md font-medium hover:bg-gray-50 transition-colors">
                        <span className="text-sm">View Details</span>
                    </button>
                    <button className={`flex-1 ${getActionButtonStyle(actionButton.variant)} text-white py-1.5 px-2 rounded-md font-medium transition-colors`}>
                        <span className="text-sm">{actionButton.text}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}