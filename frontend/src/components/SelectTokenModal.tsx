import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { formatNumberToCurrency } from "../utils";

interface Token {
  symbol: string;
  balance: string;
  value: string;
  icon: string;
  decimals: number;
  mint: string;
  selected?: boolean;
  name?: string;
  network?: string;
}

interface SelectTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokens: Token[];
  isLoadingTokens: boolean;
  onTokenSelect: (token: Token) => void;
  selectedToken?: Token;
  modalType?: 'from' | 'to';
}

export const SelectTokenModal = ({
  open,
  onOpenChange,
  tokens,
  isLoadingTokens,
  onTokenSelect,
  selectedToken,
  modalType = 'from',
}: SelectTokenModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("potlaunch");

  const filteredTokens = tokens.filter((token) =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.mint?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    onOpenChange(false);
    setSearchQuery("");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const renderTokenItem = (token: Token) => (
    <div
      key={token.mint}
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => handleTokenSelect(token)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
          <img 
            src={token.icon} 
            alt={token.symbol}
            className="w-full h-full rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-700">{token.name || token.symbol}</span>
            
          </div>
          <div className="flex items-center gap-2 mt-1 w-full">
            <span className="text-xs text-gray-500">{token.symbol}</span>
            <div className="flex justify-center items-center w-full">
                {token.mint && (
                    <span className="text-xs text-gray-400">{formatAddress(token.mint)}</span>
                )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-medium text-gray-700">
          {formatNumberToCurrency(Number(token.balance))}
        </span>
        <span className="text-xs text-gray-400">
          ${formatNumberToCurrency(Number(token.value || "0"))}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[509px] p-5">
        <DialogHeader className="flex flex-row items-center justify-between pb-5">
          <DialogTitle className="text-base font-medium text-gray-700">
            Select {modalType === 'from' ? 'From' : 'To'} Token
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100 p-1">
              <TabsTrigger 
                value="potlaunch" 
                className="flex-1 text-sm font-medium"
              >
                POTLAUNCH Tokens
              </TabsTrigger>
              <TabsTrigger 
                value="my-tokens" 
                className="flex-1 text-sm font-medium"
              >
                My Tokens
              </TabsTrigger>
              <TabsTrigger 
                value="lookup" 
                className="flex-1 text-sm font-medium"
              >
                Lookup by Address
              </TabsTrigger>
            </TabsList>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by token name, token symbol or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-sm"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border-t border-gray-200 mt-5">
              {isLoadingTokens ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading tokens...</span>
                  </div>
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <span className="text-sm text-gray-500">
                    {searchQuery ? "No tokens found" : "No tokens available"}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {filteredTokens.map(renderTokenItem)}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
