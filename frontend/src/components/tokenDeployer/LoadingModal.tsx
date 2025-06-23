import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface LoadingModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

export const LoadingModal = ({ isOpen, onCancel }: LoadingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Deploying Token</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Creating your token...</p>
            <p className="text-sm text-gray-500">
              This process may take a few moments. Please don't close this window.
            </p>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 