import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export const BridgeInfoCard = () => {
    return (
        <Card className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-none mt-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Rate</span>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-600">1 SOL = 0.0157 NEAR</span>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Estimated Processing Time</span>
                    <span className="text-xs font-medium text-gray-600">~17s</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Platform Fee</span>
                    <span className="text-xs font-medium text-gray-600">0.25%</span>
                </div>
            </div>
        </Card>
    );
};
