import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';
import { Globe, Copy, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useState } from "react";

export const Route = createFileRoute("/token/$tokenId")({
    component: TokenDetail,
});

const COLORS = ['#00A478', '#8B5CF6', '#3B82F6', '#059669', '#DC2626', '#2563EB'];

const allocationData = [
    { name: 'Public sale', value: 15, tokens: '150,000,000', usdValue: '$75,000,000', details: '20% at TGE, then 20% monthly' },
    { name: 'Team', value: 20, tokens: '200,000,000', usdValue: '$100,000,000', details: '1 year cliff, then 25% quarterly' },
    { name: 'Ecosystem', value: 25, tokens: '250,000,000', usdValue: '$125,000,000', details: '10% at TGE, then 15% quarterly' },
    { name: 'Treasury', value: 15, tokens: '150,000,000', usdValue: '$75,000,000', details: 'Locked for 2 years, then 10% quarterly' },
    { name: 'Advisors', value: 10, tokens: '100,000,000', usdValue: '$50,000,000', details: '6 month cliff, then 25% quarterly' },
    { name: 'Liquidity', value: 15, tokens: '150,000,000', usdValue: '$75,000,000', details: '50% at TGE, 50% locked for 1 year' }
];

const vestingData = [
    { month: 1, development: 10, marketing: 5 },
    { month: 3, development: 20, marketing: 15 },
    { month: 6, development: 40, marketing: 30 },
    { month: 9, development: 60, marketing: 45 },
    { month: 12, development: 80, marketing: 60 },
    { month: 15, development: 100, marketing: 75 }
];

const bondingCurveData = Array.from({ length: 20 }, (_, i) => ({
    raised: i * 500,
    price: Math.pow(1.1, i) * 0.001
}));

const paymentOptions = [
    { name: 'SOL', icon: '/chains/sol.jpeg' },
    { name: 'USDC', icon: '/icons/dollar-sign.svg' },
];

const tokenOptions = [
    { name: 'CURATE', icon: '/curate.png' },
    { name: 'USDC', icon: '/icons/dollar-sign.svg' },
];

function TokenDetail() {
    const [selectedPayment, setSelectedPayment] = useState(paymentOptions[0]);
    const [selectedToken, setSelectedToken] = useState(tokenOptions[0]);
    
    return (
        <div className="min-h-screen container mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 col-span-2 space-y-4">
                <div className="relative">
                    <div className="relative">
                        <img src="/curate.png" alt="CURATE" className="w-full h-64 object-cover rounded-lg" />
                        <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                            style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
                    </div>
                    <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                        <div className="flex items-center gap-3">
                            <img src="/curate.png" alt="CURATE" className="w-20 h-20 rounded-xl border-[3px] object-cover border-white shadow-md bg-white" />
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white uppercase">CURATE</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg text-white">$CURATE</span>
                                    <Badge variant="default" className="bg-green-500 text-white border-white border text-xs px-2 py-0.5 rounded-full">Meme Coin</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 mr-10 md:mr-14">
                            <button className="w-6 h-6 rounded-full flex items-center justify-center">
                                <Globe className="w-6 h-6 text-white hover:text-gray-00" />
                            </button>
                            <button className="w-6 h-6 rounded-full flex items-center justify-center">
                                <img src="/icons/book.svg" alt="Twitter" className="w-6 h-6 text-white" />
                            </button>
                            <button className="w-6 h-6 rounded-full flex items-center justify-center">
                                <img src="/icons/discord.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
                            </button>
                            <button className="w-6 h-6 rounded-full flex items-center justify-center">
                                <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
                            </button>
                            <button className="w-6 h-6 rounded-full flex items-center justify-center">
                                <img src="/icons/telegram.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
                            </button>

                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg max-h-[780px] bg-gray-50 relative pb-5 block md:hidden">
                    <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">ACTIVE</span>
                            <span className="ml-auto text-sm text-gray-500">24d | 12h 32m 30s</span>
                        </div>

                        <div className="text-3xl font-bold text-green-600 mb-3">$750,433</div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                            <div className="bg-green-600 h-2 rounded-full w-[60%]"></div>
                        </div>

                        <div className="grid grid-cols-3">
                            <div>
                                <div className="text-lg font-semibold">$0.0521</div>
                                <div className="text-sm text-gray-500">Current Price</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold">1,200</div>
                                <div className="text-sm text-gray-500">Holders</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold">$1M</div>
                                <div className="text-sm text-gray-500">Target</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-semibold">Join Presale</span>
                            <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-full">Fixed Price</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="text-sm text-gray-500 mb-2">You Pay</div>
                            <div className="flex items-center justify-between">
                                <input type="text" className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" placeholder="0.00" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                            <img src={selectedPayment.icon} alt={selectedPayment.name} className="w-5 h-5 rounded-full" />
                                            <span>{selectedPayment.name}</span>
                                            <div className="relative w-4 h-4 mr-5">
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                        {paymentOptions.map((option) => (
                                            <DropdownMenuItem
                                                key={option.name}
                                                onSelect={() => setSelectedPayment(option)}
                                                className="cursor-pointer hover:bg-gray-100"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                    <span>{option.name}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">$7,386</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-sm text-gray-500 mb-2">You Receive</div>
                            <div className="flex items-center justify-between">
                                <input type="text" className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" placeholder="0.00" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                            <img src={selectedToken.icon} alt={selectedToken.name} className="w-5 h-5 rounded-full" />
                                            <span>{selectedToken.name}</span>
                                            <div className="relative w-4 h-4 mr-5">
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                        {tokenOptions.map((option) => (
                                            <DropdownMenuItem
                                                key={option.name}
                                                onSelect={() => setSelectedToken(option)}
                                                className="cursor-pointer hover:bg-gray-100"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                    <span>{option.name}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">$7,386</div>
                        </div>

                        <button className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg mb-4">
                            Buy $CURATE
                        </button>
                    </div>
                    <div className="p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg mt-4">
                        <p className="text-xs text-gray-500 text-center">
                            Tokens will be distributed to your wallet after the presale ends. Always do your own research.
                        </p>
                    </div>
                </div>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Description</h2>
                    <p className="text-gray-600 text-sm">
                        CURATE is the native utility and governance token powering the Curate.fun ecosystem, a decentralized platform for automating content curation through crowdsourcing and AI.
                        Built for communities and content creator networks, CURATE incentivizes participation, rewards contribution, and enables automated content discovery. Through its innovative staking and approval in automated publishing and revenue sharing, CURATE fuels every step in the lifecycle of collaborative publishing.
                    </p>
                </Card>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Tokenomics & Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 gap-3 mt-5 border-b border-gray-200 pb-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Initial Market Cap</p>
                                <p className="text-sm font-semibold">2,500,000,000</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Total supply</p>
                                <p className="text-sm font-semibold">1,000,000,000</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Min. Contribution</p>
                                <p className="text-sm font-semibold">0.1 SOL</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Current price</p>
                                <p className="text-sm font-semibold">$0.0521</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Hard cap</p>
                                <p className="text-sm font-semibold">$1,500,000</p>
                            </div>
                            <div className="flex flex-row justify-between gap-6 p-3 items-center rounded-lg bg-gray-100/60">
                                <p className="text-sm text-gray-500 mb-1">Max Contribution</p>
                                <p className="text-sm font-semibold">10 SOL</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mt-2">
                        <label className="text-sm text-gray-500">Contract Address</label>
                        <div className="flex flex-row gap-2 items-center">
                            <img src="/icons/solana.svg" alt="SOL" className="w-6 h-6" />
                            <p className="text-sm text-gray-500">8sWkTMrhoVbWuW......qvJNgS2f7jo</p>
                            <button className="w-4 h-4 rounded-full flex items-center justify-center">
                                <Copy className="w-4 h-4 text-black hover:text-gray-500" />
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Allocation & Vesting</h2>
                    <div className="flex justify-center bg-gray-100/60 rounded-lg py-2 md:py-4">
                        <div className="w-full max-w-xs md:max-w-md" style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {allocationData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="w-full overflow-x-auto mt-6">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 text-gray-600 font-medium">Allocation</th>
                                    <th className="text-left py-3 text-gray-600 font-medium">Percentage</th>
                                    <th className="text-left py-3 text-gray-600 font-medium">Tokens</th>
                                    <th className="text-left py-3 text-gray-600 font-medium">USD value</th>
                                    <th className="text-left py-3 text-gray-600 font-medium">Vesting</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocationData.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">{item.value}%</td>
                                        <td className="py-4">{item.tokens}</td>
                                        <td className="py-4">{item.usdValue}</td>
                                        <td className="py-4 text-gray-600">{item.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="p-4 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Vesting Schedule</h2>
                    <div className="w-full h-[220px] md:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={vestingData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 14 }}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis tick={{ fontSize: 14 }} />
                                <Tooltip contentStyle={{ fontSize: 14 }} />
                                <Line
                                    type="monotone"
                                    dataKey="development"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    name="Development Fund"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="marketing"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    name="Marketing Pool"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                                
                <Card className="p-4 md:p-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Bonding Curve Price Chart</h2>
                    <div className="mb-6 w-full h-[220px] md:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bondingCurveData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="raised"
                                    tick={{ fontSize: 14 }}
                                    padding={{ left: 10, right: 10 }}
                                />
                                <YAxis tick={{ fontSize: 14 }} />
                                <Tooltip contentStyle={{ fontSize: 14 }} />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Initial Price</p>
                            <p className="font-semibold">0.001 SOL</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Final Price</p>
                            <p className="font-semibold">0.005 SOL</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Target Raise</p>
                            <p className="font-semibold">1500 SOL</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        This token uses a bonding curve, meaning its price changes dynamically based on demand and supply.
                        The price increases as more tokens are minted and purchased.
                    </p>
                </Card>
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-[730px] bg-gray-50 relative hidden md:block">
                <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium">ACTIVE</span>
                        <span className="ml-auto text-sm text-gray-500">24d | 12h 32m 30s</span>
                    </div>

                    <div className="text-3xl font-bold text-green-600 mb-3">$750,433</div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                        <div className="bg-green-600 h-2 rounded-full w-[60%]"></div>
                    </div>

                    <div className="grid grid-cols-3">
                        <div>
                            <div className="text-lg font-semibold">$0.0521</div>
                            <div className="text-sm text-gray-500">Current Price</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold">1,200</div>
                            <div className="text-sm text-gray-500">Holders</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold">$1M</div>
                            <div className="text-sm text-gray-500">Target</div>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 p-4 rounded-t-2xl bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-semibold">Join Presale</span>
                        <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-full">Fixed Price</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-500 mb-2">You Pay</div>
                        <div className="flex items-center justify-between">
                            <input type="text" className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" placeholder="0.00" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                        <img src={selectedPayment.icon} alt={selectedPayment.name} className="w-5 h-5 rounded-full" />
                                        <span>{selectedPayment.name}</span>
                                        <div className="relative w-4 h-4 mr-5">
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                    {paymentOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.name}
                                            onSelect={() => setSelectedPayment(option)}
                                            className="cursor-pointer hover:bg-gray-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                <span>{option.name}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">$7,386</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-500 mb-2">You Receive</div>
                        <div className="flex items-center justify-between">
                            <input type="text" className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" placeholder="0.00" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                        <img src={selectedToken.icon} alt={selectedToken.name} className="w-5 h-5 rounded-full" />
                                        <span>{selectedToken.name}</span>
                                        <div className="relative w-4 h-4 mr-5">
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] bg-white">
                                    {tokenOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.name}
                                            onSelect={() => setSelectedToken(option)}
                                            className="cursor-pointer hover:bg-gray-100"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                                                <span>{option.name}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">$7,386</div>
                    </div>

                    <button className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg mb-4">
                        Buy $CURATE
                    </button>
                </div>
                <div className="absolute bottom-5 left-0 right-0 p-2 border border-gray-200 bg-[#F1F5F9] w-[80%] mx-auto rounded-lg">
                    <p className="text-xs text-gray-500 text-center">
                        Tokens will be distributed to your wallet after the presale ends. Always do your own research.
                    </p>
                </div>
            </div>
        </div>
    );
}
