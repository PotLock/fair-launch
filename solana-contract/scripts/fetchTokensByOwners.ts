import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

async function getTokenBalances(walletAddress) {

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  try {
    const publicKey = new PublicKey(walletAddress);

    // Fetch all token accounts owned by the wallet
    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    // Array to store token balances
    const balances = [];

    for (const account of tokenAccounts.value) {
      // Get account info
      const accountInfo = await connection.getParsedAccountInfo(account.pubkey);
      const parsedInfo = accountInfo.value?.data as ParsedAccountData

      if (parsedInfo) {
        const mint = parsedInfo.parsed.info.mint; // Token mint address
        const balance = parsedInfo.parsed.info.tokenAmount.uiAmount; // Balance in human-readable format
        const decimals = parsedInfo.parsed.info.tokenAmount.decimals; // Token decimals

        balances.push({
          mint,
          balance,
          decimals,
          tokenAccount: account.pubkey.toBase58(),
        });
      }
    }

    balances.forEach(({ mint, balance, decimals, tokenAccount }) => {
      console.log(`Token Mint: ${mint}`);
      console.log(`Balance: ${balance} (Decimals: ${decimals})`);
      console.log(`Token Account: ${tokenAccount}`);
      console.log('---');
    });

    return balances;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    throw error;
  }
}


const walletAddress = 'Yo8A62FyZT4goufRRhDU6ENy3pLSVWEgFxe2SQhn5u6';
getTokenBalances(walletAddress);