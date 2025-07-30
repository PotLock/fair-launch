import { useState } from 'react';
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount, useConnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNearWallet } from './NearWalletProvider';
import WalletProfileModal from './WalletProfileModal';

const WalletButton: React.FC = () => {
  const { 
    currentChain
  } = useWalletContext();
  const { address, isConnected: evmConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { connected: solanaConnected } = useWallet();
  
  // Get NEAR wallet from NearWalletProvider
  const nearWallet = useNearWallet();
  
  // State for profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleConnect = async () => {
    switch (currentChain) {
      case 'evm':
        if (!evmConnected) {
          connect({ connector: connectors[0] });
        }
        break;
      case 'solana':
        // Solana wallet connection is handled by WalletMultiButton
        break;
      case 'near':
        if (!nearWallet?.signedAccountId && nearWallet) {
          try {
            nearWallet.signIn();
          } catch (error) {
            console.error('Failed to connect NEAR wallet:', error);
          }
        }
        break;
    }
  };

  const isWalletConnected = () => {
    switch (currentChain) {
      case 'evm':
        return evmConnected;
      case 'solana':
        return solanaConnected;
      case 'near':
        return !!nearWallet?.signedAccountId;
      default:
        return false;
    }
  };

  const getAccountInfo = () => {
    switch (currentChain) {
      case 'evm':
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
      case 'solana':
        return 'Solana Wallet';
      case 'near':
        return nearWallet?.signedAccountId && nearWallet.signedAccountId.length > 60 ? `${nearWallet.signedAccountId.slice(0, 6)}...${nearWallet.signedAccountId.slice(-4)}` : nearWallet?.signedAccountId || '';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    if (isWalletConnected()) {
      const accountInfo = getAccountInfo();
      return accountInfo;
    }
    
    return 'Connect Wallet';
  };

  const handleWalletButtonClick = () => {
    if (isWalletConnected()) {
      setIsProfileModalOpen(true);
    } else {
      handleConnect();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Wallet Connection */}
      {currentChain === 'solana' ? (
        <WalletMultiButton />
      ) : (
        <button
          onClick={handleWalletButtonClick}
          className="w-full bg-white border border-gray-200 px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          {getButtonText()}
        </button>
      )}
      
      {/* Profile Modal for all chains */}
      <WalletProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default WalletButton;