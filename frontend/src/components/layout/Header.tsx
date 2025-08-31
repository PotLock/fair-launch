import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { WalletButton } from '../WalletButton';
import { PlusIcon } from 'lucide-react';


export default function Header() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="xl:container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/" className="flex items-center">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                        <span className="text-2xl font-semibold md:block hidden ml-2">POTLAUNCH</span>
                    </Link>
                </div>
                <div className="flex items-center">
                    <nav className="hidden lg:flex items-center space-x-8 mr-10">
                        <Link to="/tokens" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Launchpad</span>
                        </Link>
                        <Link to="/create" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Create Token</span>
                        </Link>
                        <Link to="/bridge" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>Bridge Tokens</span>
                        </Link>
                        <Link to="/my-tokens" className="text-gray-600 hover:text-gray-900">
                            <span className='text-sm'>My Tokens</span>
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center space-x-4">
                        <WalletButton />
                    </div>
                    
                    <div className='flex flex-row items-center space-x-4'>
                        <a href='/create' className='flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-[#DD3345] text-white hover:bg-[#DD3345]/85 hover:text-white transition-all duration-300 md:hidden'>
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
                            <Link to="/tokens" className="text-gray-600 hover:text-gray-900 text-lg" onClick={() => setSidebarOpen(false)}>
                                Launchpad
                            </Link>
                            <Link to="/create" className="text-gray-600 hover:text-gray-900 text-lg" onClick={() => setSidebarOpen(false)}>
                                Create Token
                            </Link>
                            <Link to="/bridge" className="text-gray-600 hover:text-gray-900">
                                <span className='text-sm'>Bridge Tokens</span>
                            </Link>
                            <Link to="/my-tokens" className="text-gray-600 hover:text-gray-900 text-lg" onClick={() => setSidebarOpen(false)}>
                                My Tokens
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