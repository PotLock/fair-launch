import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

export const BasicInformation = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Basic Information</div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </div>
                {isExpanded && (
                    <>
                        <div className="text-xs text-gray-500 mb-4">Token Name, Symbol & Supply</div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium mb-1">Token Name</div>
                                <Input placeholder="Token Name" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Token Symbol</div>
                                <Input placeholder="Token Symbol" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Total Supply</div>
                                <Input placeholder="Total Supply" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Decimal</div>
                                <Input placeholder="Decimal" />
                            </div>
                            <div>
                                <Textarea rows={3} placeholder="Describe your token's purpose" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {
                isExpanded && (
                    <div className="mb-6 space-y-2">
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="text-sm font-semibold">Token Branding</div>
                        </div>
                        <div className="flex gap-4 mb-2 flex-col md:flex-row">
                            <div className='flex flex-col gap-1'>
                                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-6 min-h-[160px]">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 flex items-center justify-center mb-2">
                                            <img src="/icons/add-image.svg" alt="add-image" />
                                        </div>
                                        <div className="text-sm font-medium text-gray-700 mb-1">Token Logo</div>
                                        <div className="text-xs text-gray-500 mb-2">Drop your image here or browse</div>
                                    </div>
                                </div>
                                <Tabs defaultValue="upload" className="w-full">
                                    <TabsList className="w-full">
                                        <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-white">Upload</TabsTrigger>
                                        <TabsTrigger value="ai" className="flex-1 data-[state=active]:bg-white">AI Generate</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="upload" className="mt-2">
                                        <div className="text-sm text-gray-500">Upload your token logo</div>
                                    </TabsContent>
                                    <TabsContent value="ai" className="mt-2">
                                        <div className="text-sm text-gray-500">Generate token logo using AI</div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-6 min-h-[160px]">
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 flex items-center justify-center mb-2">
                                        <img src="/icons/add-image.svg" alt="add-image" />
                                    </div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">Banner image</div>
                                    <div className="text-xs text-gray-500 mb-2">Drop your image here or browse</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}