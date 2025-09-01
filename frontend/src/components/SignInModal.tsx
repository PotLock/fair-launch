import React, { useEffect,useState } from 'react';
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import {toast} from "react-hot-toast"

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConnectedWallet {
  type: 'solana' | 'near' | 'evm';
  address: string;
  displayName: string;
}


const SignInModal: React.FC<SignInModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const {signIn, signOut, signedAccountId} = useWalletSelector()
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connectSolana, disconnectSolana, isSolanaConnected, solanaPublicKey } = useWalletContext();
  const [isConnectingNEAR, setIsConnectingNEAR] = useState(false);

  // Update connected wallets when wallet states change
  useEffect(() => {
    const wallets: ConnectedWallet[] = [];
    
    if (isSolanaConnected && solanaPublicKey) {
      wallets.push({
        type: 'solana',
        address: solanaPublicKey,
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
    
    if (evmConnected && evmAddress) {
      wallets.push({
        type: 'evm',
        address: evmAddress,
        displayName: 'MetaMask'
      });
    }
  }, [isSolanaConnected, solanaPublicKey, signedAccountId, evmConnected, evmAddress]);

  const handleConnectSolana = async () => {
    try {
      await connectSolana();
      onClose();
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
    }
  };

  const handleConnectNEAR = async () => {
    try {
      setIsConnectingNEAR(true);
      
      signIn();
      onClose();
    } catch (error) {
      toast.error(`Failed to connect NEAR wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnectingNEAR(false);
    }
  };

  const handleConnectMetaMask = async () => {
    if (!evmConnected) {
      try {
        await connect({ connector: connectors.length >= 2 ? connectors[1] : connectors[0] });
        onClose();
      } catch (error) {
        console.error('Failed to connect MetaMask:', error);
      }
    }
  };

  const handleDisconnectWallet = (walletType: 'solana' | 'near' | 'evm') => {
    switch (walletType) {
      case 'solana':
        disconnectSolana();
        break;
      case 'near':
        if (signedAccountId) {
          signOut();
        }
        break;
      case 'evm':
        disconnect();
        break;
    }
  };

  const getWalletStatus = (type: 'solana' | 'near' | 'evm') => {
    switch (type) {
      case 'solana':
        return isSolanaConnected;
      case 'near':
        return !!signedAccountId;
      case 'evm':
        return evmConnected;
      default:
        return false;
    }
  };

  const getWalletAddress = (type: 'solana' | 'near' | 'evm') => {
    switch (type) {
      case 'solana':
        return solanaPublicKey ? `${solanaPublicKey.slice(0, 6)}...${solanaPublicKey.slice(-4)}` : '';
      case 'near':
        return signedAccountId && signedAccountId.length > 60 
          ? `${signedAccountId.slice(0, 6)}...${signedAccountId.slice(-4)}` 
          : signedAccountId || '';
      case 'evm':
        return evmAddress ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : '';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-center flex-1">
              How do you want to sign in?
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Popular options</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src="/chains/solana.svg" alt="Solana" className="w-6 h-6" />
                  <span className="text-sm font-medium">Solana Wallet</span>
                </div>
                {getWalletStatus('solana') ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {getWalletAddress('solana')}
                    </span>
                    <button
                      onClick={() => handleDisconnectWallet('solana')}
                      className="px-3 py-1 hover:bg-red-50 hover:border-red-200 border border-red-200 rounded-md cursor-pointer text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectSolana}
                    className="px-3 text-sm border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-md py-1 cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src="/chains/near.png" alt="NEAR" className="w-5 h-5" />
                  <span className="text-sm font-medium">NEAR Wallet</span>
                </div>
                {getWalletStatus('near') ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {getWalletAddress('near')}
                    </span>
                    <button
                      onClick={() => handleDisconnectWallet('near')}
                      className="px-3 py-1 hover:bg-red-50 hover:border-red-200 border border-red-200 rounded-md cursor-pointer text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectNEAR}
                    disabled={isConnectingNEAR}
                    className="px-3 text-sm border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-md py-1 cursor-pointer"
                  >
                    {isConnectingNEAR ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src="/chains/ethereum.png" alt="EVM" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium">EVM Wallet</span>
                </div>
                {getWalletStatus('evm') ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {getWalletAddress('evm')}
                    </span>
                    <button
                      onClick={() => handleDisconnectWallet('evm')}
                      className="px-3 py-1 hover:bg-red-50 border hover:border-red-200 border-red-200 rounded-md cursor-pointer text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectMetaMask}
                    className="px-3 text-sm border border-gray-200 hover:bg-gray-100 hover:border-gray-300 rounded-md py-1 cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal; 