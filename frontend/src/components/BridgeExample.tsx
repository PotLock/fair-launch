import { useState, useEffect } from 'react';
import { useBridge } from '../hook/useBridge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNearWallet } from './NearWalletProvider';
import toast from 'react-hot-toast';
import { useWalletSelector } from "@near-wallet-selector/react-hook";


const BridgeExample: React.FC = () => {
  const { 
    deployTokenNear,
    transferTokenSolanaToNear,
    getTokenInfo
  } = useBridge();
  
  const { publicKey, connected } = useWallet();
  const { signedAccountId, signIn } = useNearWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [tokenMint, setTokenMint] = useState('');
  const [recipientNearAccount, setRecipientNearAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [checkResult, setCheckResult] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const {signIn:signInNear} = useWalletSelector()

  // Function to check token balance and ownership
  const handleCheckTokenBalance = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    setIsCheckingBalance(true);
    try {
      const info = await getTokenInfo(tokenMint);
      
      if (info) {
        setTokenInfo(info);
        const balance = info.balance || BigInt(0);
        const balanceInTokens = Number(balance) / Math.pow(10, info.decimals);

        const resultText = `✅ Token Information Found!\n\n` +
          `📋 Token Details:\n` +
          `• Name: ${info.name}\n` +
          `• Symbol: ${info.symbol}\n` +
          `• Mint Address: ${info.mint}\n` +
          `• Decimals: ${info.decimals}\n` +
          `💰 Your Balance:\n` +
          `• Formatted Balance: ${balanceInTokens.toLocaleString()} ${info.symbol}\n\n` +
          `${balance > 0 ? '✅ You own this token!' : '❌ You do not own this token'}`;
        
        setCheckResult(resultText);
        
        if (balance > 0) {
          toast.success(`You own ${balanceInTokens.toLocaleString()} ${info.symbol}`);
        } else {
          toast.error('You do not own this token');
        }
      } else {
        setTokenInfo(null);
        setCheckResult('❌ Token not found or invalid mint address');
        toast.error('Token not found or invalid mint address');
      }
    } catch (error) {
      setTokenInfo(null);
      setCheckResult(`❌ Error checking token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Error checking token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Auto-check balance when token mint changes (with debounce)
  const handleTokenMintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenMint(value);
    setTokenInfo(null); // Clear previous token info
    
    // Clear result if mint address is cleared
    if (!value) {
      setCheckResult('');
      return;
    }
  };

  // Use useEffect for debounced auto-check
  useEffect(() => {
    if (!tokenMint || !connected || !publicKey) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleCheckTokenBalance();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [tokenMint, connected, publicKey]);

  const handleDeployToken = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }
    setIsLoading(true);
    try {
      const toastId = toast.loading("Starting token deployment process...");
      setCheckResult('🔄 Starting token deployment process...\n1. Logging metadata...\n2. Waiting 60 seconds for completion...\n3. Getting VAA...\n4. Deploying to NEAR...');
      const toastWatting = toast.loading("Waiting 60 seconds for logMetadata", {id: toastId});
      const result = await deployTokenNear(tokenMint);
      const nearExplorerUrl = result 
        ? `https://testnet.nearblocks.io/en/txns/${result}`
        : null;
      
      const resultText = `✅ Token deployed to NEAR successfully!\nTransaction: ${JSON.stringify(result, null, 2)}`;
      
      if (nearExplorerUrl) {
        setCheckResult(`${resultText}\n\n🔗 View on NEAR Explorer: ${nearExplorerUrl}`);
      } else {
        setCheckResult(resultText);
      }
      toast.success("Token deployed to NEAR successfully!", { id: toastWatting });
    } catch (error) {
      setCheckResult(`❌ Error deploying token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToken = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    if (!recipientNearAccount) {
      toast.error('Please enter a recipient NEAR account');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    setIsTransferring(true);
    try {
      const toastId = toast.loading("Starting token transfer process...");
      setCheckResult('🔄 Starting token transfer process...\n1. Initiating bridge transfer...\n2. Waiting for confirmation...\n3. Processing on NEAR...');
      
      // Convert amount to bigint (assuming 6 decimals for most tokens)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1000000));
      
      const result = await transferTokenSolanaToNear(tokenMint, amountBigInt, recipientNearAccount);
      
      const resultText = `✅ Token transfer initiated successfully!\nTransaction: ${result?.transactionHash || 'Completed'}\nStatus: ${result?.status || 'Processing'}`;
      
      if (result?.transactionHash) {
        const solanaExplorerUrl = `https://explorer.solana.com/tx/${result.transactionHash}?cluster=devnet`;
        setCheckResult(`${resultText}\n\n🔗 View on Solana Explorer: ${solanaExplorerUrl}`);
      } else {
        setCheckResult(resultText);
      }
      
      toast.success("Token transfer initiated successfully!", { id: toastId });
    } catch (error) {
      setCheckResult(`❌ Error transferring token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Solana → NEAR Bridge Test</h2>
      
      {/* Wallet Status Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solana Wallet Connection */}
        <div className="p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Solana Wallet Status</h3>
          {connected ? (
            <div className="space-y-2">
              <p><strong>Connected Address:</strong> {publicKey?.toBase58().slice(0,20)}...</p>
              <p className="text-sm text-gray-600">Network: Solana Devnet</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No Solana wallet connected</p>
              <p className="text-sm text-gray-500">Please connect your Solana wallet to continue</p>
            </div>
          )}
        </div>

        {/* NEAR Wallet Connection */}
        <div className="p-4 bg-green-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">NEAR Wallet Status</h3>
          {signedAccountId ? (
            <div className="space-y-2">
              <p><strong>Connected Account:</strong> {signedAccountId}</p>
              <p className="text-sm text-gray-600">Network: NEAR Testnet</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No NEAR wallet connected</p>
              <button
                onClick={signInNear}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Connect NEAR Wallet
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solana Token Mint Address
            {isCheckingBalance && (
              <span className="ml-2 text-blue-500 text-xs">🔄 Checking balance...</span>
            )}
          </label>
          <input
            type="text"
            value={tokenMint}
            onChange={handleTokenMintChange}
            placeholder="e.g., So11111111111111111111111111111111111111112"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient NEAR Account
          </label>
          <input
            type="text"
            value={recipientNearAccount}
            onChange={(e) => setRecipientNearAccount(e.target.value)}
            placeholder="e.g., account.testnet"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            step="0.000001"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDeployToken}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
          >
            {isLoading ? 'Deploying...' : 'Deploy Token to NEAR'}
          </button>

          <button
            onClick={handleTransferToken}
            disabled={isTransferring || !connected || !signedAccountId}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isTransferring ? 'Transferring...' : 'Transfer Token to NEAR'}
          </button>


        </div>

        {checkResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{checkResult}</pre>
          </div>
        )}

      </div>
    </div>
  );
};

export default BridgeExample; 