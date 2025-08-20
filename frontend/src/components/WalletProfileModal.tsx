import React, { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Copy } from 'lucide-react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

interface WalletProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConnectedWallet {
  type: 'solana' | 'near' | 'evm';
  address: string;
  displayName: string;
}

const WalletProfileModal: React.FC<WalletProfileModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { address, isConnected: evmConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { publicKey, connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const { signOut, signedAccountId} = useWalletSelector()
  const [copied, setCopied] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string>('');

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

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setCopiedAddress('');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
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
        disconnect();
        break;
    }
  };

  const connectedWallets = getConnectedWallets();

  if (connectedWallets.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Connected Wallets ({connectedWallets.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connected Wallets List */}
          <div className="space-y-3">
            {connectedWallets.map((wallet, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={wallet.type === 'solana' ? '/chains/solana.svg' : 
                           wallet.type === 'near' ? '/chains/near.png' : 
                           '/icons/metamask.svg'} 
                      alt={wallet.displayName} 
                      className="w-5 h-5" 
                    />
                    <span className="font-medium text-sm">{wallet.displayName}</span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDisconnectWallet(wallet.type)}
                    className="h-6 p-3 border border-red-200 hover:bg-red-50 shadow-none cursor-pointer text-xs text-red-600 hover:text-red-700 bg-white rounded-md"
                  >
                    Disconnect
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Address</span>
                    <button
                      onClick={() => handleCopyAddress(wallet.address)}
                      className="h-6 px-3 py-1 text-xs flex flex-row gap-1 items-center cursor-pointer border border-gray-200 hover:bg-gray-50 rounded-md"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copied && copiedAddress === wallet.address ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {wallet.address.length > 40 
                      ? `${wallet.address.slice(0, 20)}...${wallet.address.slice(-20)}` 
                      : wallet.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletProfileModal; 