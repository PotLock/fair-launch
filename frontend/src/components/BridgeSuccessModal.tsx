import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, Copy, ExternalLink, X } from 'lucide-react';

interface BridgeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
  transactionHashNear?: string;
  amount: string;
  tokenName: string;
  fromChain: string;
  toChain: string;
}

export function BridgeSuccessModal({
  isOpen,
  onClose,
  transactionHash,
  transactionHashNear,
  amount,
  tokenName,
  fromChain,
  toChain,
}: BridgeSuccessModalProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if needed
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const openExplorer = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="relative p-6 bg-white rounded-lg shadow-lg">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Success indicator and title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Bridge Successful
            </h3>
          </div>

          {/* Transaction details */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Successfully bridged {amount} {tokenName} from {fromChain} to {toChain}
            </p>
          </div>

          {/* Transaction hash section */}
          {transactionHash && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Transaction hash</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 text-sm font-mono">
                    {transactionHash.length > 20 
                      ? `${transactionHash.slice(0, 8)}...${transactionHash.slice(-8)}`
                      : transactionHash
                    }
                  </span>
                  <button
                    onClick={() => copyToClipboard(transactionHash)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => openExplorer(transactionHash)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NEAR transaction hash if available */}
          {transactionHashNear && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">NEAR Transaction hash</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 text-sm font-mono">
                    {transactionHashNear.length > 20 
                      ? `${transactionHashNear.slice(0, 8)}...${transactionHashNear.slice(-8)}`
                      : transactionHashNear
                    }
                  </span>
                  <button
                    onClick={() => copyToClipboard(transactionHashNear)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => openExplorer(transactionHashNear)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
