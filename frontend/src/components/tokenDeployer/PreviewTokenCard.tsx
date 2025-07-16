import { Progress } from "../ui/progress";
import { useDeployStore } from "../../stores/deployStores";
import { formatNumberWithCommas } from "../../utils";

export const PreviewTokenCard = () => {
    const { basicInfo } = useDeployStore();
    const { name, symbol, description, supply, avatarUrl, bannerUrl } = basicInfo;
    
    const progress = supply ? (Number(supply) / 1000000000) * 100 : 0;

    return (
        <div className="rounded-3xl min-h-[480px] max-h-[480px] min-w-[400px] max-w-sm  border border-gray-200 bg-white p-4" style={{boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'}}>
            <div className="text-center text-lg font-medium mb-2">Preview Token Card</div>
            <div className="flex flex-col gap-4 border-2 border-gray-200 rounded-2xl p-2">
                <div className="relative">
                    <div className="relative">
                        {
                            bannerUrl ? (
                                <img src={bannerUrl} alt='banner' className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                            ):  
                            (
                                <div className="w-full h-48 rounded-2xl border border-gray-200 flex items-center justify-center">
                                    <img src='/icons/image.svg' alt='banner' className="w-12 h-12 z-10" />
                                </div>
                            )
                        }
                        <div className="absolute left-0 bottom-0 w-full h-48 rounded-b-2xl pointer-events-none"
                            style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'}} />
                        </div>
                        <div className="absolute left-4 bottom-4 flex items-center gap-3 flex-row justify-between w-full">
                        
                        {
                            avatarUrl ? (
                                <img src={avatarUrl} alt='avatar' className="w-14 h-14 rounded-full border-2 object-cover border-white" />
                            ):
                            (
                                <div className="w-14 h-14 rounded-full border-2 object-cover border-white flex items-center justify-center">
                                    <img src='/icons/image.svg' alt='avatar' className="w-6 h-6 z-10" />
                                </div>
                            )
                        }

                        <div className="flex flex-col mr-8">
                            <span className="text-xl font-bold text-white uppercase">{name || 'TOKEN NAME'}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-white">${symbol || 'TICKER'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="line-clamp-2 min-h-[40px] w-full pb-12 border-b border-gray-200">
                    <p className="text-sm text-gray-700">{description || 'Lorem ipsum dolor sit amet consectetur. Facilisis sit tellus ultrices vitae. Sit ac tellus posuere dolor pulvinar interdum pharetra fermentum commodo. Aliquam vita...'}</p>
                </div>
                
                <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Token Type</span>
                        <span>{supply ? formatNumberWithCommas(supply) : '0'}/1,000,000,000</span>
                    </div>
                    <Progress value={progress} className="h-4 bg-gray-200" />
                </div>
            </div>
        </div>
    );
}