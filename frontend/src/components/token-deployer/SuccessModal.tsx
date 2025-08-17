import { CheckCircle, Eye, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  tokenName: string;
  onViewToken: () => void;
  onReturnHome: () => void;
  onClose: () => void;
}

export const SuccessModal = ({ 
  isOpen, 
  tokenName, 
  onViewToken, 
  onReturnHome,
  onClose
}: SuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Token Created Successfully!</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-green-600">
              🚀 {tokenName} has been deployed!
            </p>
            <p className="text-sm text-gray-500">
              Your token is now live on the Solana network.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
            <Button
              onClick={onViewToken}
              className="flex items-center gap-2 flex-1 text-white"
            >
              <Eye className="w-4 h-4" />
              View Token
            </Button>
            <Button
              variant="outline"
              onClick={onReturnHome}
              className="flex items-center gap-2 flex-1"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 