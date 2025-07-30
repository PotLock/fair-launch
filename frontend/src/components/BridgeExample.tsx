import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBridge } from '../hook/userBridge';
import { PublicKey } from '@solana/web3.js';

// Example token addresses for devnet/testnet
const EXAMPLE_TOKENS = {
  SOLANA: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Devnet USDC
    SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  },
  NEAR: {
    USDC: 'usdc.fakes.testnet', // Testnet USDC
    NEAR: 'wrap.testnet', // Wrapped NEAR
  }
};

export const BridgeExample: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { 
    bridgeSolanaToNear, 
    bridgeNearToSolana, 
    getTransferStatus, 
    getTransferHistory,
    getFeeEstimation,
    isBridging 
  } = useBridge();

  const [amount, setAmount] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [transferDirection, setTransferDirection] = useState<'solana-to-near' | 'near-to-solana'>('solana-to-near');
  const [transferResult, setTransferResult] = useState<any>(null);

  // Example: Bridge from Solana to NEAR
  const handleSolanaToNear = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your Solana wallet first');
      return;
    }

    if (!amount || !recipientAddress) {
      alert('Please enter amount and recipient address');
      return;
    }

    try {
      const tokenMint = EXAMPLE_TOKENS.SOLANA[selectedToken as keyof typeof EXAMPLE_TOKENS.SOLANA];
      const amountBigInt = BigInt(parseFloat(amount) * 1e6); // Assuming 6 decimals for USDC

      const result = await bridgeSolanaToNear(
        tokenMint,
        amountBigInt,
        recipientAddress
      );

      setTransferResult(result);
      console.log('Bridge result:', result);
    } catch (error) {
      console.error('Bridge failed:', error);
      alert(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Example: Bridge from NEAR to Solana
  const handleNearToSolana = async () => {
    if (!recipientAddress) {
      alert('Please enter recipient Solana address');
      return;
    }

    try {
      const tokenContract = EXAMPLE_TOKENS.NEAR[selectedToken as keyof typeof EXAMPLE_TOKENS.NEAR];
      const amountBigInt = BigInt(parseFloat(amount) * 1e6); // Assuming 6 decimals for USDC

      // Note: You'll need to pass the actual NEAR wallet selector and account ID
      // This is just an example - you'll need to integrate with your NEAR wallet
      const result = await bridgeNearToSolana(
        tokenContract,
        amountBigInt,
        recipientAddress,
        'your-near-account.testnet', // Replace with actual NEAR account
        {} // Replace with actual NEAR wallet selector
      );

      setTransferResult(result);
      console.log('Bridge result:', result);
    } catch (error) {
      console.error('Bridge failed:', error);
      alert(`Bridge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Example: Get fee estimation
  const handleGetFee = async () => {
    if (!connected || !publicKey || !recipientAddress) {
      alert('Please connect wallet and enter recipient address');
      return;
    }

    try {
      const tokenMint = EXAMPLE_TOKENS.SOLANA[selectedToken as keyof typeof EXAMPLE_TOKENS.SOLANA];
      const sender = `sol:${publicKey.toBase58()}`;
      const recipient = `near:${recipientAddress}`;
      const tokenAddress = `sol:${tokenMint}`;

      const fee = await getFeeEstimation(sender, recipient, tokenAddress);
      console.log('Fee estimation:', fee);
      alert(`Fee: ${fee.native_token_fee} SOL, ${fee.transferred_token_fee} tokens`);
    } catch (error) {
      console.error('Fee estimation failed:', error);
      alert(`Fee estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Example: Get transfer history
  const handleGetHistory = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your Solana wallet first');
      return;
    }

    try {
      const senderAddress = `sol:${publicKey.toBase58()}`;
      const history = await getTransferHistory(senderAddress, 10);
      console.log('Transfer history:', history);
      alert(`Found ${history.length} transfers`);
    } catch (error) {
      console.error('Failed to get transfer history:', error);
      alert(`Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Omni Bridge Example</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Transfer Direction</label>
        <select 
          value={transferDirection} 
          onChange={(e) => setTransferDirection(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="solana-to-near">Solana → NEAR</option>
          <option value="near-to-solana">NEAR → Solana</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Token</label>
        <select 
          value={selectedToken} 
          onChange={(e) => setSelectedToken(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="USDC">USDC</option>
          <option value="SOL">SOL/NEAR</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {transferDirection === 'solana-to-near' ? 'NEAR Account' : 'Solana Address'}
        </label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder={transferDirection === 'solana-to-near' ? 'account.testnet' : 'Solana address'}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="space-y-2">
        {transferDirection === 'solana-to-near' ? (
          <button
            onClick={handleSolanaToNear}
            disabled={!connected || isBridging}
            className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isBridging ? 'Bridging...' : 'Bridge Solana → NEAR'}
          </button>
        ) : (
          <button
            onClick={handleNearToSolana}
            disabled={isBridging}
            className="w-full p-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            {isBridging ? 'Bridging...' : 'Bridge NEAR → Solana'}
          </button>
        )}

        <button
          onClick={handleGetFee}
          disabled={!connected}
          className="w-full p-2 bg-yellow-500 text-white rounded disabled:bg-gray-300"
        >
          Get Fee Estimation
        </button>

        <button
          onClick={handleGetHistory}
          disabled={!connected}
          className="w-full p-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
        >
          Get Transfer History
        </button>
      </div>

      {transferResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Transfer Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(transferResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Note:</strong></p>
        <ul className="list-disc list-inside">
          <li>This example uses Solana devnet and NEAR testnet</li>
          <li>Make sure your wallets are connected to the correct networks</li>
          <li>For NEAR → Solana, you'll need to integrate with your NEAR wallet</li>
          <li>Token addresses are examples - use actual testnet tokens</li>
        </ul>
      </div>
    </div>
  );
}; 