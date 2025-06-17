import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

import dotenv from 'dotenv';

dotenv.config();

const heliusApiKey = process.env.HELIUS_API_KEY;

async function getTokenInfo(mint) {

    const SOLANA_DEVNET_RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: `{"jsonrpc":"2.0","id":"1","method":"getAsset","params":{"id":"${mint}"}}`
    };
    fetch(SOLANA_DEVNET_RPC_ENDPOINT, options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));

}


const mintPublicKey = 'FJ62A4tYv4W5s34pHYpARkzUteLZjunQnCjMiLLNspNY';

getTokenInfo(mintPublicKey);