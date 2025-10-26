import {
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Bar
} from 'recharts';

interface CandlestickData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface CandlestickChartProps {
    data: CandlestickData[];
    height?: number;
    showReferenceLine?: boolean;
    referenceLineValue?: number;
}

// Custom tooltip component - simplified
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isGreen = data.close > data.open;
        const color = isGreen ? '#10b981' : '#ef4444';
        
        return (
            <div className="bg-gray-900 text-white rounded-lg p-3 shadow-lg border border-gray-700">
                <p className="font-medium text-sm">{label}</p>
                <div className="space-y-1 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs">O:</span>
                        <span className="font-medium text-sm">${data.open.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs">H:</span>
                        <span className="font-medium text-sm">${data.high.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs">L:</span>
                        <span className="font-medium text-sm">${data.low.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs">C:</span>
                        <span className="font-medium text-sm" style={{ color }}>${data.close.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Transform data for candlestick visualization
function transformDataForCandlesticks(data: CandlestickData[]) {
    return data.map((item, index) => {
        const isGreen = item.close > item.open;
        const bodyHeight = Math.abs(item.close - item.open);
        const bodyY = Math.min(item.open, item.close);
        
        return {
            time: item.time,
            index,
            // For wick visualization
            wickHigh: item.high,
            wickLow: item.low,
            // For body visualization
            bodyOpen: item.open,
            bodyClose: item.close,
            bodyHeight,
            bodyY,
            isGreen,
            // Original data for tooltip
            open: item.open,
            close: item.close,
            high: item.high,
            low: item.low,
            // For bar chart
            value: bodyHeight,
            fill: isGreen ? '#10b981' : '#ef4444'
        };
    });
}

export function CandlestickChart({ 
    data, 
    height = 400, 
    showReferenceLine = false, 
    referenceLineValue = 3740 
}: CandlestickChartProps) {
    // Calculate min and max values for proper scaling
    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.05; // 5% padding for tighter view

    const scale = {
        min: minPrice - padding,
        max: maxPrice + padding
    };

    const transformedData = transformDataForCandlesticks(data);

    return (
        <div className="w-full bg-white rounded-lg p-4" style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={transformedData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                >
                    <CartesianGrid 
                        strokeDasharray="1 1" 
                        stroke="#e5e7eb" 
                        horizontal={true}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        dy={10}
                    />
                    <YAxis
                        domain={[scale.min, scale.max]}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickLine={false}
                        tickFormatter={(value) => value.toLocaleString()}
                        orientation="right"
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {showReferenceLine && (
                        <ReferenceLine
                            y={referenceLineValue}
                            stroke="#6b7280"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                        />
                    )}
                    
                    {/* Render candlesticks using SVG elements */}
                    {transformedData.map((entry, index) => {
                        const isGreen = entry.isGreen;
                        const color = isGreen ? '#10b981' : '#ef4444';
                        
                        // Calculate positions
                        const xPos = index * (100 / transformedData.length);
                        const candleWidth = (100 / transformedData.length) * 0.6;
                        const candleX = xPos + (100 / transformedData.length) * 0.2;
                        
                        // Scale values to chart coordinates
                        const chartHeight = height - 60;
                        const highY = chartHeight - ((entry.high - scale.min) / (scale.max - scale.min)) * chartHeight;
                        const lowY = chartHeight - ((entry.low - scale.min) / (scale.max - scale.min)) * chartHeight;
                        const openY = chartHeight - ((entry.open - scale.min) / (scale.max - scale.min)) * chartHeight;
                        const closeY = chartHeight - ((entry.close - scale.min) / (scale.max - scale.min)) * chartHeight;
                        
                        return (
                            <g key={index}>
                                {/* Wick */}
                                <line
                                    x1={xPos + (100 / transformedData.length) / 2}
                                    y1={highY}
                                    x2={xPos + (100 / transformedData.length) / 2}
                                    y2={lowY}
                                    stroke={color}
                                    strokeWidth={1.5}
                                />
                                {/* Body */}
                                <rect
                                    x={candleX}
                                    y={Math.min(openY, closeY)}
                                    width={candleWidth}
                                    height={Math.max(Math.abs(closeY - openY), 2)}
                                    fill={color}
                                    stroke={color}
                                    strokeWidth={1}
                                />
                            </g>
                        );
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

// Sample data generator for demonstration with fixed sample data
export function generateSampleCandlestickData(): CandlestickData[] {
    return [
        { time: "3:00 AM", open: 3740.50, high: 3745.20, low: 3735.80, close: 3738.90 },
        { time: "4:00 AM", open: 3738.90, high: 3755.60, low: 3738.90, close: 3752.30 },
        { time: "5:00 AM", open: 3752.30, high: 3758.40, low: 3748.70, close: 3756.80 },
        { time: "6:00 AM", open: 3756.80, high: 3762.10, low: 3752.40, close: 3759.20 },
        { time: "7:00 AM", open: 3759.20, high: 3765.30, low: 3755.60, close: 3761.40 },
        { time: "8:00 AM", open: 3761.40, high: 3768.90, low: 3758.20, close: 3765.70 },
        { time: "9:00 AM", open: 3765.70, high: 3772.50, low: 3762.80, close: 3768.30 },
        { time: "10:00 AM", open: 3768.30, high: 3775.60, low: 3765.40, close: 3771.20 },
        { time: "11:00 AM", open: 3771.20, high: 3778.90, low: 3768.50, close: 3775.80 },
        { time: "12:00 PM", open: 3775.80, high: 3782.40, low: 3772.60, close: 3778.90 },
        { time: "1:00 PM", open: 3778.90, high: 3785.20, low: 3775.30, close: 3781.60 },
        { time: "2:00 PM", open: 3781.60, high: 3788.70, low: 3778.40, close: 3785.30 },
        { time: "3:00 PM", open: 3785.30, high: 3792.10, low: 3782.50, close: 3788.70 },
        { time: "4:00 PM", open: 3788.70, high: 3795.40, low: 3785.60, close: 3791.20 },
        { time: "5:00 PM", open: 3791.20, high: 3798.30, low: 3788.70, close: 3795.60 },
        { time: "6:00 PM", open: 3795.60, high: 3802.80, low: 3792.40, close: 3798.90 },
        { time: "7:00 PM", open: 3798.90, high: 3805.20, low: 3795.80, close: 3802.40 },
        { time: "8:00 PM", open: 3802.40, high: 3808.60, low: 3798.90, close: 3805.70 },
        { time: "9:00 PM", open: 3805.70, high: 3812.30, low: 3802.40, close: 3808.90 },
        { time: "10:00 PM", open: 3808.90, high: 3815.40, low: 3805.70, close: 3812.20 },
        { time: "11:00 PM", open: 3812.20, high: 3818.70, low: 3808.90, close: 3815.60 },
        { time: "12:00 AM", open: 3815.60, high: 3822.10, low: 3812.20, close: 3818.40 },
        { time: "1:00 AM", open: 3818.40, high: 3825.30, low: 3815.60, close: 3821.80 },
        { time: "2:00 AM", open: 3821.80, high: 3828.50, low: 3818.40, close: 3825.20 },
        { time: "27 Jul", open: 3825.20, high: 3832.80, low: 3822.50, close: 3828.90 }
    ];
} 