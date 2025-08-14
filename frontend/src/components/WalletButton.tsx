import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import WalletProfileModal from './WalletProfileModal';
import SignInModal from './SignInModal';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ConnectedWallet {
  type: 'solana' | 'near' | 'evm';
  address: string;
  displayName: string;
}

const WalletButton: React.FC = () => {
  const { address, isConnected: evmConnected } = useAccount();
  const { disconnect: disconnectEVM } = useDisconnect();
  const { connected: solanaConnected, disconnect: disconnectSolana, publicKey } = useWallet();
  
  const {signedAccountId, signOut} = useWalletSelector()

  // State for modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const isAnyWalletConnected = () => {
    return evmConnected || solanaConnected || !!signedAccountId;
  };

  const getConnectedWallets = (): ConnectedWallet[] => {
    const wallets: ConnectedWallet[] = [];
    
    if (solanaConnected && publicKey) {
      wallets.push({
        type: 'solana',
        address: publicKey.toString(),
        displayName: 'Solana Wallet'
      });
    }
    
    if (signedAccountId) {
      wallets.push({
        type: 'near',
        address: signedAccountId,
        displayName: 'NEAR Wallet'
      });
    }
    
    if (evmConnected && address) {
      wallets.push({
        type: 'evm',
        address: address,
        displayName: 'MetaMask'
      });
    }
    
    return wallets;
  };

  const getConnectedWalletsCount = () => {
    let count = 0;
    if (evmConnected) count++;
    if (solanaConnected) count++;
    if (signedAccountId) count++;
    return count;
  };

  const getButtonText = () => {
    if (isAnyWalletConnected()) {
      const count = getConnectedWalletsCount();
      if (count === 1) {
        // Show the connected wallet address
        if (evmConnected && address) {
          return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        if (solanaConnected) {
          return 'Solana Wallet';
        }
        if (signedAccountId) {
          return signedAccountId.length > 60 
            ? `${signedAccountId.slice(0, 6)}...${signedAccountId.slice(-4)}` 
            : signedAccountId;
        }
      } else {
        // Show count of connected wallets
        return `${count} Wallets Connected`;
      }
    }
    
    return 'Sign In';
  };

  const handleWalletButtonClick = () => {
    if (isAnyWalletConnected()) {
      setIsProfileModalOpen(true);
    } else {
      setIsSignInModalOpen(true);
    }
  };

  const handleDisconnectWallet = async (walletType: 'solana' | 'near' | 'evm') => {
    switch (walletType) {
      case 'solana':
        disconnectSolana();
        break;
      case 'near':
        if (signedAccountId) {
          try {
            await signOut();
          } catch (error) {
            console.error('Failed to disconnect NEAR wallet:', error);
          }
        }
        break;
      case 'evm':
        disconnectEVM();
        break;
    }
  };

  const connectedWallets = getConnectedWallets();

  if (isAnyWalletConnected()) {
    return (
      <div className="flex flex-col gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{getButtonText()}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white">
            {connectedWallets.map((wallet, index) => (
              <DropdownMenuItem key={index} className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <img 
                    src={wallet.type === 'solana' ? '/chains/solana.svg' : 
                         wallet.type === 'near' ? '/chains/near.png' : 
                         '/icons/metamask.svg'} 
                    alt={wallet.displayName} 
                    className="w-4 h-4" 
                  />
                  {/* <span className="text-sm">{wallet.displayName}</span> */}
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer' onClick={() => setIsProfileModalOpen(true)}>
              <User className="w-4 h-4" />
              Manage Wallets
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer' onClick={() => setIsSignInModalOpen(true)}>
              <User className="w-4 h-4" />
              Add More Wallets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {connectedWallets.map((wallet, index) => (
              <DropdownMenuItem 
                key={`disconnect-${index}`} 
                onClick={() => handleDisconnectWallet(wallet.type)}
                className="text-red-600 hover:text-red-700 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Disconnect {wallet.displayName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Sign In Modal */}
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
        />
        
        {/* Profile Modal for all chains */}
        <WalletProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Wallet Connection */}
      <button
        onClick={handleWalletButtonClick}
        className="w-full bg-white border border-gray-200 px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        {getButtonText()}
      </button>
      
      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
      
      {/* Profile Modal for all chains */}
      <WalletProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default WalletButton;