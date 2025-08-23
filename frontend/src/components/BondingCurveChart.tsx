import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TokenInfo, BondingCurveTokenInfo } from "../utils/token";
import { CandlestickChart, generateSampleCandlestickData } from "./CandlestickChart";

interface BondingCurveChartProps {
    tokenInfo: TokenInfo;
    curveConfig: any;
    bondingCurveInfo?: BondingCurveTokenInfo;
}

// Generate chart data for linear bonding curve
function generateLinearBondingCurveChartData(
    tokenInfo: TokenInfo, 
    curveConfig: any, 
): Array<{ raised: number; price: number }> {
    // Default values if data is not available
    const targetRaise = Number(tokenInfo?.targetRaise) || 1000; // SOL
    const initialPrice = curveConfig?.initialPrice ? Number(curveConfig.initialPrice) / 10 ** 9 : 0.001; // SOL
    const finalPrice = Number(tokenInfo?.finalPrice) || initialPrice * 10; // SOL
    
    // Generate 50 data points for smooth curve
    const dataPoints = 50;
    const data: Array<{ raised: number; price: number }> = [];
    
    for (let i = 0; i <= dataPoints; i++) {
        const raised = (targetRaise * i) / dataPoints;
        
        const price = initialPrice + (finalPrice - initialPrice) * (raised / targetRaise);
        
        data.push({
            raised: Math.round(raised * 100) / 100, // Round to 2 decimal places
            price: Math.round(price * 1000000) / 1000000 // Round to 6 decimal places for SOL
        });
    }
    
    return data;
}

export function BondingCurveChart({ tokenInfo, curveConfig, bondingCurveInfo }: BondingCurveChartProps) {
    return (
        <Card className="p-4 md:p-6 mb-6 shadow-none border border-gray-200">
            <h2 className="text-xl font-medium mb-4">Bonding Curve Price Chart</h2>
            <div className="flex flex-row justify-between items-start">
                <div className="relative w-full">
                    <Tabs defaultValue="price" className="w-full">
                        <div className='flex flex-row items-center justify-between'>
                            <TabsList>
                                <TabsTrigger value="price" className="flex flex-row gap-1 text-xs">
                                    <img src="/icons/candlestick-light.svg" alt="candlestick-light" className="w-4 h-4" />
                                    <span>Price</span>
                                </TabsTrigger>
                                <TabsTrigger value="bonding-curve" className="flex flex-row gap-1 text-xs">
                                    <img src="/icons/ease-curve-control-points.svg" alt="ease-curve-control-points" className="w-3 h-3" />
                                    <span>Bonding Curve</span>
                                </TabsTrigger>
                            </TabsList>
                            <div className="bg-gray-100 flex flex-row gap-1 p-2 py-1 rounded-lg">
                                <button className="bg-white border flex justify-center items-center border-gray-200 hover:bg-gray-50 hover:border-gray-300 p-1 py-0.5 rounded-md w-10">
                                    <span className="text-xs font-medium">ALL</span>
                                </button>
                                <button className="p-1 text-gray-700 py-0.5 rounded-md w-10">
                                    <span className="text-xs">1D</span>
                                </button>
                                <button className="p-1 text-gray-700 py-0.5 rounded-md w-10">
                                    <span className="text-xs">7D</span>
                                </button>
                                <button className="p-1 text-gray-700 py-0.5 rounded-md w-10">
                                    <span className="text-xs">1M</span>
                                </button>
                                <button className="p-1 text-gray-700 py-0.5 rounded-md w-10">
                                    <span className="text-xs">1Y</span>
                                </button>
                            </div>
                        </div>
                        <TabsContent value="price" className='w-full'>
                            <div className="w-full">
                                <CandlestickChart 
                                    data={generateSampleCandlestickData()} 
                                    height={400}
                                    showReferenceLine={false}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="bonding-curve">
                            <div className="w-full">
                                <div className="mb-6 w-full h-[280px] md:h-[320px] bg-gray-50 rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={generateLinearBondingCurveChartData(tokenInfo, curveConfig)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="raised"
                                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                                padding={{ left: 20, right: 20 }}
                                                axisLine={{ stroke: '#d1d5db' }}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12, fill: '#6b7280' }} 
                                                axisLine={{ stroke: '#d1d5db' }}
                                            />
                                            <RechartsTooltip 
                                                contentStyle={{ 
                                                    fontSize: 14, 
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }} 
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="price"
                                                stroke="#8884d8"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#8884d8' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Initial Price</p>
                                        <p className="font-semibold">{curveConfig ? (Number(curveConfig.initialPrice) / 10 ** 9).toLocaleString() : '-'} SOL</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Final Price</p>
                                        <p className="font-semibold">{tokenInfo?.finalPrice || '-'} SOL</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-1">Target Raise</p>
                                        <p className="font-semibold">{tokenInfo?.targetRaise || '-'} SOL</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    This token uses a bonding curve, meaning its price changes dynamically based on demand and supply.
                                    The price increases as more tokens are minted and purchased.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                
            </div>
        </Card>
    )
}