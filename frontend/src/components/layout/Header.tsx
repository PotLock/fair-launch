import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { IconChevronDown } from '@tabler/icons-react';
import { WalletButton } from '../WalletButton';
import { PlusIcon } from 'lucide-react';

interface NetworkOption {
    id: string;
    name: string;
    icon: string;
}


export default function Header() {
    const [selectedNetwork, setSelectedNetwork] = useState('Solana');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const networks: NetworkOption[] = [
        { id: 'solana', name: 'Solana', icon: '/chains/solana.svg' }
    ];

    const selectedNetworkData = networks.find(n => n.name === selectedNetwork) || networks[0];

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="xl:container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    {/* Logo for both mobile and desktop */}
                    <Link to="/" className="flex items-center">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                        <span className="text-2xl font-semibold md:block hidden ml-2">POTLAUNCH</span>
                    </Link>
                </div>
                <div className="flex items-center">
                    <nav className="hidden lg:flex items-center space-x-8 mr-10">
                        <Link to="/create" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Token Creator</span>
                        </Link>
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Launchpad</span>
                        </Link>
                        <Link to="/my-tokens" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>My tokens</span>
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center space-x-4">
                        <div className="relative">
                            <button 
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                            >
                                <img src={selectedNetworkData.icon} alt={selectedNetworkData.name} className='w-4 h-4' />
                                <span className='text-sm'>{selectedNetworkData.name}</span>
                                <IconChevronDown className={`w-4 h-4 transition-transform duration-200 ${isNetworkDropdownOpen ? 'transform rotate-180' : ''}`} />
                            </button>
                            
                            {isNetworkDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                    {networks.map((network) => (
                                        <button
                                            key={network.id}
                                            className={`w-full flex items-center justify-start space-x-2 px-3 py-2 hover:bg-gray-50 ${
                                                network.name === selectedNetwork ? 'bg-gray-50' : ''
                                            }`}
                                            onClick={() => {
                                                setSelectedNetwork(network.name);
                                                setIsNetworkDropdownOpen(false);
                                            }}
                                        >
                                            <img src={network.icon} alt={network.name} className='w-4 h-4' />
                                            <span className="text-sm">{network.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <WalletButton />
                    </div>
                    
                    <div className='flex flex-row items-center space-x-4'>
                        <a href='/create' className='flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-black text-white hover:bg-gray-700 hover:text-black transition-all duration-300 md:hidden'>
                            <PlusIcon className='w-4 h-4' />
                            <span className='text-sm'>Create</span>
                        </a>
                        <button
                            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-gray-200"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black opacity-40" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative bg-white w-64 h-full shadow-lg flex flex-col p-6">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close menu"
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                        <div className="flex items-center mb-8">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-2" />
                            <span className="text-2xl font-semibold">POTLAUNCH</span>
                        </div>
                        <nav className="flex flex-col space-y-4 mb-8">
                            <Link to="/create" className="text-gray-600 hover:text-gray-900 text-lg" onClick={() => setSidebarOpen(false)}>
                                Token Creator
                            </Link>
                            <Link to="/" className="text-gray-600 hover:text-gray-900 text-lg" onClick={() => setSidebarOpen(false)}>
                                Launchpad
                            </Link>
                        </nav>
                        <div className="mt-auto">
                            <WalletButton />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}