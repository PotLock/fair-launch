import React, { useState } from 'react';
import { useWalletContext } from '../context/WalletProviderContext';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNearWallet } from './NearWalletProvider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Copy, LogOut, RefreshCw } from 'lucide-react';

interface WalletProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletProfileModal: React.FC<WalletProfileModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { currentChain } = useWalletContext();
  const { address, isConnected: evmConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { publicKey, connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const nearWallet = useNearWallet();
  const [copied, setCopied] = useState(false);

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
        return publicKey ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}` : '';
      case 'near':
        return nearWallet?.signedAccountId && nearWallet.signedAccountId.length > 60 ? `${nearWallet.signedAccountId.slice(0, 6)}...${nearWallet.signedAccountId.slice(-4)}` : nearWallet?.signedAccountId || '';
      default:
        return '';
    }
  };

  const getFullAddress = () => {
    switch (currentChain) {
      case 'evm':
        return address || '';
      case 'solana':
        return publicKey ? publicKey.toString() : '';
      case 'near':
        return nearWallet?.signedAccountId || '';
      default:
        return '';
    }
  };

  const handleCopyAddress = async () => {
    const address = getFullAddress();
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleChangeWallet = () => {
    switch (currentChain) {
      case 'evm':
        onClose();
        break;
      case 'solana':
        // Solana wallet change is handled by the wallet adapter
        onClose();
        break;
      case 'near':
        if (nearWallet) {
          nearWallet.signIn();
        }
        onClose();
        break;
    }
  };

  const handleDisconnect = async () => {
    switch (currentChain) {
      case 'evm':
        disconnect();
        break;
      case 'solana':
        disconnectSolana();
        break;
      case 'near':
        if (nearWallet) {
          try {
            await nearWallet.signOut();
          } catch (error) {
            console.error('Failed to disconnect NEAR wallet:', error);
          }
        }
        break;
    }
    onClose();
  };

  if (!isWalletConnected()) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Wallet Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Account Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Connected Account</p>
            <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
              {getAccountInfo()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-gray-50"
              onClick={handleCopyAddress}
            >
              <Copy className="w-4 h-4 mr-3" />
              <span className="font-medium">
                {copied ? 'Address copied!' : 'Copy address'}
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-gray-50"
              onClick={handleChangeWallet}
            >
              <RefreshCw className="w-4 h-4 mr-3" />
              <span className="font-medium">Change wallet</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDisconnect}
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-medium">Disconnect</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletProfileModal; 