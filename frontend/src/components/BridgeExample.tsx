import React, { useState } from 'react';
import { useBridge } from '../hook/useBridge';
import { useWallet } from '@solana/wallet-adapter-react';
import { ChainKind } from 'omni-bridge-sdk';
import toast from 'react-hot-toast';

const BridgeExample: React.FC = () => {
  const { 
    bridgeSolanaToNear,
    getFeeEstimation,
    isTokenRegistered,
    SUPPORTED_TOKENS,
    handleLogMetadata,
    checkWalletNetwork,
    deployTokenNear,
    handleGetVaa
  } = useBridge();
  
  const { publicKey, connected } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenMint, setTokenMint] = useState('');
  const [recipientNearAccount, setRecipientNearAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [checkResult, setCheckResult] = useState<string>('');
  const [walletStatus, setWalletStatus] = useState<string>('');

  const handleCheckWalletNetwork = async () => {
    setIsLoading(true);
    try {
      const networkInfo = await checkWalletNetwork();
      if (networkInfo.isValid) {
        setWalletStatus(`✅ Wallet connected to ${networkInfo.network}\nSOL Balance: ${networkInfo.balance} SOL\nHas funds for fees: ${networkInfo.hasFunds ? 'Yes' : 'No'}`);
      } else {
        setWalletStatus(`❌ ${networkInfo.message}`);
      }
    } catch (error) {
      setWalletStatus(`❌ Error checking wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckTokenRegistration = async () => {
    if (!tokenMint) {
      toast.error('Please enter a token mint address');
      return;
    }

    setIsLoading(true);
    try { 
      const isRegistered = await isTokenRegistered(tokenMint);
      setCheckResult(isRegistered ? 'Token is registered with Omni Bridge' : 'Token is NOT registered with Omni Bridge');
    } catch (error) {
      setCheckResult(`Error checking token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogTokenMetadata = async () => {
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
      // First check wallet network
      const networkInfo = await checkWalletNetwork();
      if (!networkInfo.isValid) {
        setCheckResult(`❌ ${networkInfo.message}`);
        return;
      }
      
      if (!networkInfo.hasFunds) {
        setCheckResult('❌ Insufficient SOL balance for transaction fees. Please add some SOL to your wallet.');
        return;
      }

      setCheckResult('🔄 Starting logMetadata... Please wait.');
      const result = await handleLogMetadata(tokenMint);
      
      if (typeof result === 'string') {
        setCheckResult(`✅ Token metadata logged successfully!\nTransaction Hash: ${result}`);
      } else if (result && typeof result === 'object' && 'txHash' in result) {
        setCheckResult(`✅ Token metadata logged successfully!\nTransaction Hash: ${result.txHash}\nVAA: ${result.vaa || 'Not retrieved'}`);
      } else {
        setCheckResult('❌ Failed to log token metadata');
      }
    } catch (error) {
      setCheckResult(`❌ Error logging metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFee = async () => {
    if (!tokenMint || !recipientNearAccount) {
      toast.error('Please enter both token mint and recipient NEAR account');
      return;
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const sender = publicKey.toBase58();
      const fee = await getFeeEstimation(sender, recipientNearAccount, tokenMint);
      setCheckResult(`Fee estimation: ${JSON.stringify(fee, null, 2)}`);
    } catch (error) {
      setCheckResult(`Error getting fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBridgeToNear = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    if (!tokenMint || !recipientNearAccount || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Convert amount to token units (assuming 9 decimals for most Solana tokens)
      const amountBigInt = BigInt(parseFloat(amount) * Math.pow(10, 9));
      
      const result = await bridgeSolanaToNear(
        tokenMint,
        amountBigInt,
        recipientNearAccount
      );

      setCheckResult(`Bridge initiated successfully! Transaction: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setCheckResult(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
      // First check wallet network
      const networkInfo = await checkWalletNetwork();
      if (!networkInfo.isValid) {
        setCheckResult(`❌ ${networkInfo.message}`);
        return;
      }
      
      if (!networkInfo.hasFunds) {
        setCheckResult('❌ Insufficient SOL balance for transaction fees. Please add some SOL to your wallet.');
        return;
      }

      setCheckResult('🔄 Starting token deployment process...\n1. Logging metadata...\n2. Waiting 60 seconds for completion...\n3. Getting VAA...\n4. Deploying to NEAR...');
      
      const result = await deployTokenNear(tokenMint);
      
      if (result) {
        setCheckResult(`✅ Token deployed to NEAR successfully!\n\nDetails:\n- Transaction Hash: ${result.txHash}\n- VAA: ${result.vaa}\n- NEAR Result: ${JSON.stringify(result.result, null, 2)}`);
      } else {
        setCheckResult('❌ Failed to deploy token to NEAR');
      }
    } catch (error) {
      setCheckResult(`❌ Error deploying token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetVaaClick = async () => {
    if (!transactionHash) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setIsLoading(true);
    try {
      const vaa = await handleGetVaa(transactionHash);
      if (vaa) {
        setCheckResult(`✅ VAA retrieved successfully!\nVAA: ${vaa}`);
      } else {
        setCheckResult('❌ Failed to retrieve VAA');
      }
    } catch (error) {
      setCheckResult(`❌ Error getting VAA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Solana → NEAR Bridge Test</h2>
      
      {/* Solana Wallet Connection */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Solana Wallet Status</h3>
        {connected ? (
          <div className="space-y-2">
            <p><strong>Connected Address:</strong> {publicKey?.toBase58()}</p>
            <p className="text-sm text-gray-600">Network: Solana Devnet</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">No Solana wallet connected</p>
            <p className="text-sm text-gray-500">Please connect your Solana wallet to continue</p>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solana Token Mint Address
          </label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Hash (for VAA)
          </label>
          <input
            type="text"
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            placeholder="Enter transaction hash to get VAA"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCheckWalletNetwork}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
          >
            {isLoading ? 'Checking Network...' : 'Check Wallet Network'}
          </button>

          <button
            onClick={handleCheckTokenRegistration}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Token Registration'}
          </button>

          <button
            onClick={handleLogTokenMetadata}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Logging...' : 'Log Token Metadata'}
          </button>

          <button
            onClick={async () => {
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
                const networkInfo = await checkWalletNetwork();
                if (!networkInfo.isValid) {
                  setCheckResult(`❌ ${networkInfo.message}`);
                  return;
                }
                
                if (!networkInfo.hasFunds) {
                  setCheckResult('❌ Insufficient SOL balance for transaction fees. Please add some SOL to your wallet.');
                  return;
                }

                setCheckResult('🔄 Logging metadata and waiting for completion...\nThis will take about 1 minute.');
                const result = await handleLogMetadata(tokenMint, true); // true = wait for completion
                
                if (result && typeof result === 'object' && 'txHash' in result) {
                  setCheckResult(`✅ Token metadata logged and VAA retrieved!\n\nTransaction Hash: ${result.txHash}\nVAA: ${result.vaa}`);
                } else {
                  setCheckResult('❌ Failed to log token metadata');
                }
              } catch (error) {
                setCheckResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Log Metadata + Get VAA'}
          </button>

          <button
            onClick={handleGetFee}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
          >
            {isLoading ? 'Getting Fee...' : 'Get Fee Estimation'}
          </button>

          <button
            onClick={handleBridgeToNear}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? 'Bridging...' : 'Bridge to NEAR'}
          </button>

          <button
            onClick={handleDeployToken}
            disabled={isLoading || !connected}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
          >
            {isLoading ? 'Deploying...' : 'Deploy Token to NEAR'}
          </button>

          <button
            onClick={handleGetVaaClick}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {isLoading ? 'Getting VAA...' : 'Get VAA'}
          </button>
        </div>

        {checkResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{checkResult}</pre>
          </div>
        )}

        {walletStatus && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Wallet Status:</h3>
            <pre className="text-sm whitespace-pre-wrap">{walletStatus}</pre>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Supported Solana Tokens:</h3>
          <div className="space-y-2">
            {Object.entries(SUPPORTED_TOKENS).map(([symbol, token]) => (
              <div key={symbol} className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium">{symbol}</h4>
                <div className="text-sm text-gray-600">
                  <div>Solana: {token.addresses.solana}</div>
                  <div>Decimals: {token.decimals.solana}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Connect your Solana wallet (make sure it's on devnet)</li>
            <li>Enter a Solana token mint address (e.g., So11111111111111111111111111111111111111112 for Wrapped SOL)</li>
            <li>Enter the recipient NEAR account (e.g., account.testnet)</li>
            <li>Check if the token is registered with Omni Bridge</li>
            <li>If not registered, try to log metadata (may require bridge admin)</li>
            <li>Deploy token to NEAR (creates wrapped token on NEAR side)</li>
            <li>Get fee estimation before bridging</li>
            <li>Bridge tokens from Solana devnet to NEAR testnet</li>
            <li>Use the VAA feature to retrieve Validators Approval Authority from a transaction hash</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <h4 className="font-semibold mb-2 text-yellow-800">Important Notes:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            <li>This test uses Solana devnet and NEAR testnet</li>
            <li>Make sure your Solana wallet is connected to devnet</li>
            <li>Only supported tokens are guaranteed to work</li>
            <li>If you get "token not registered" error, try using Wrapped SOL (So11111111111111111111111111111111111111112)</li>
            <li>Bridge transfers may take several minutes to complete</li>
            <li><strong>LogMetadata takes ~1 minute to complete on chain</strong></li>
            <li>Use "Log Metadata + Get VAA" button to automatically wait and get VAA</li>
            <li>Use "Deploy Token to NEAR" for complete deployment process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BridgeExample; 