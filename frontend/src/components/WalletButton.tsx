import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import WalletSidebar from './WalletSidebar';
import SignInModal from './SignInModal';
import { User } from 'lucide-react';
import { Button } from './ui/button';

export const WalletButton: React.FC = () => {
  const { address, isConnected: evmConnected } = useAccount();
  const { connected: solanaConnected } = useWallet();
  
  const {signedAccountId} = useWalletSelector()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState<string | null>(null);

  const isAnyWalletConnected = () => {
    return evmConnected || solanaConnected || !!signedAccountId;
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
        return `${count} Wallets Connected`;
      }
    }
    
    return 'Sign In';
  };

  const handleWalletButtonClick = () => {
    if (isAnyWalletConnected()) {
      setIsSidebarOpen(true);
    } else {
      setIsSignInModalOpen(true);
    }
  };

  useEffect(() => {
    if (showCopySuccess) {
      const timer = setTimeout(() => {
        setShowCopySuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopySuccess]);


  if (isAnyWalletConnected()) {
    return (
      <div className="flex flex-col gap-2">
        <Button 
          variant="default" 
          className="shadow-none text-black flex items-center space-x-2 bg-white border border-gray-200 hover:text-black cursor-pointer hover:bg-gray-50"
          onClick={() => setIsSidebarOpen(true)}
        >
          <User className="w-4 h-4" />
          <span className='text-black'>{getButtonText()}</span>
        </Button>
        
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
        />
        
        <WalletSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onConnectAnother={() => {
            setIsSidebarOpen(false);
            setIsSignInModalOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleWalletButtonClick}
        className="w-full bg-white border border-gray-200 px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        {getButtonText()}
      </button>
      
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
      
      <WalletSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onConnectAnother={() => {
          setIsSidebarOpen(false);
          setIsSignInModalOpen(true);
        }}
      />
    </div>
  );
};

