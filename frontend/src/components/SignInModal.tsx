import React, { useState } from 'react';
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useNearWallet } from './NearWalletProvider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
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
  const nearWallet = useNearWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connectSolana, disconnectSolana, isSolanaConnected, solanaPublicKey } = useWalletContext();
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [isConnectingNEAR, setIsConnectingNEAR] = useState(false);

  // Update connected wallets when wallet states change
  React.useEffect(() => {
    const wallets: ConnectedWallet[] = [];
    
    if (isSolanaConnected && solanaPublicKey) {
      wallets.push({
        type: 'solana',
        address: solanaPublicKey,
        displayName: 'Solana Wallet'
      });
    }
    
    if (nearWallet?.signedAccountId) {
      wallets.push({
        type: 'near',
        address: nearWallet.signedAccountId,
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
    
    setConnectedWallets(wallets);
  }, [isSolanaConnected, solanaPublicKey, nearWallet?.signedAccountId, evmConnected, evmAddress]);

  const handleConnectSolana = async () => {
    // Use the Solana wallet connection function from context
    try {
      await connectSolana();
      // Close modal after successful connection
      onClose();
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
    }
  };

  const handleConnectNEAR = async () => {
    if (nearWallet) {
      try {
        setIsConnectingNEAR(true);
        
        // Check if wallet is initialized
        if (!nearWallet.isInitialized) {
          alert('NEAR wallet is still initializing. Please wait a moment and try again.');
          return;
        }
        
        await nearWallet.signIn();
        // Close modal after successful connection
        onClose();
      } catch (error) {
        console.error('Failed to connect NEAR wallet:', error);
        // You might want to show a toast or alert here
        alert(`Failed to connect NEAR wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsConnectingNEAR(false);
      }
    } else {
      console.error('NEAR wallet not available');
      alert('NEAR wallet is not available. Please try refreshing the page.');
    }
  };

  const handleConnectMetaMask = async () => {
    if (!evmConnected) {
      try {
        await connect({ connector: connectors[0] });
        // Close modal after successful connection
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
        if (nearWallet) {
          nearWallet.signOut();
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
        return !!nearWallet?.signedAccountId;
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
        return nearWallet?.signedAccountId && nearWallet.signedAccountId.length > 60 
          ? `${nearWallet.signedAccountId.slice(0, 6)}...${nearWallet.signedAccountId.slice(-4)}` 
          : nearWallet?.signedAccountId || '';
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
          {/* Popular options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Popular options</h3>
            <div className="space-y-2">
              {/* Solana Wallet */}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectWallet('solana')}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectSolana}
                    className="h-8 px-3"
                  >
                    Connect
                  </Button>
                )}
              </div>

              {/* NEAR Wallet */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src="/chains/near.png" alt="NEAR" className="w-6 h-6" />
                  <span className="text-sm font-medium">NEAR Wallet</span>
                </div>
                {getWalletStatus('near') ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {getWalletAddress('near')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectWallet('near')}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectNEAR}
                    className="h-8 px-3"
                    disabled={isConnectingNEAR || !nearWallet?.isInitialized}
                  >
                    {isConnectingNEAR ? 'Connecting...' : nearWallet?.isInitialized ? 'Connect' : 'Initializing...'}
                  </Button>
                )}
              </div>

              {/* MetaMask */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src="/icons/metamask.svg" alt="MetaMask" className="w-6 h-6" />
                  <span className="text-sm font-medium">MetaMask</span>
                </div>
                {getWalletStatus('evm') ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {getWalletAddress('evm')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectWallet('evm')}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectMetaMask}
                    className="h-8 px-3"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Connected wallets summary */}
          {connectedWallets.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Connected Wallets ({connectedWallets.length})
              </h3>
              <div className="space-y-2">
                {connectedWallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium">{wallet.displayName}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal; 