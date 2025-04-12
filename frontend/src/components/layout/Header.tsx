import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { IconChevronDown, IconWallet } from '@tabler/icons-react';
import { WalletButton } from '../customs/WalletButton';

interface NetworkOption {
    id: string;
    name: string;
    icon: string;
}


export default function Header() {
    const [selectedNetwork, setSelectedNetwork] = useState('Solana');
    const [walletAddress, setWalletAddress] = useState('78d41a...25d2');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

    const networks: NetworkOption[] = [
        { id: 'solana', name: 'Solana', icon: '/chains/solana.svg' }
    ];

    const selectedNetworkData = networks.find(n => n.name === selectedNetwork) || networks[0];

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/" className="text-2xl font-semibold">
                        Unnamed
                    </Link>
                </div>

                <div className="flex items-center space-x-20">
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Token Creator</span>
                        </Link>
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Launchpad</span>
                        </Link>
                    </nav>
                    
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <button 
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                            >
                                <img src={selectedNetworkData.icon} alt={selectedNetworkData.name} className='w-4 h-4' />
                                <span className='text-sm'>{selectedNetworkData.name}</span>
                                <IconChevronDown className={`w-4 h-4 transition-transform duration-200 ${isNetworkDropdownOpen ? 'transform rotate-180' : ''}`} />
                            </button>

                            {/* Network Dropdown */}
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

                        {/* <button className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50">
                            <IconWallet className='w-4 h-4' />
                            <span className='text-sm'>{walletAddress}</span>
                            <IconChevronDown className='w-4 h-4' />
                        </button> */}
                        <WalletButton />
                    </div>
                </div>
            </div>
        </header>
    );
}