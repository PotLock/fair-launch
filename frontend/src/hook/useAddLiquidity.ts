import { DEVNET_PROGRAM_ID, getCpmmPdaAmmConfigId } from '@raydium-io/raydium-sdk-v2';
import { PublicKey, Transaction } from '@solana/web3.js';
import { connection, initSdk, txVersion } from '../configs/raydium';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import useAnchorProvider from './useAnchorProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import BN from 'bn.js';
import { getTokenProgramId } from '../lib/raydium';


export interface CreatePoolParams {
	tokenA: {
		mint: PublicKey
		decimals: number
	},
	tokenB: {
		mint: PublicKey
		decimals: number
	},
	amountTokenA: string,
	amountTokenB: string,
}

export default function useAddLiquidity() {
	const provider = useAnchorProvider();
	const { publicKey, sendTransaction, signAllTransactions } = useWallet();

	async function createPool({ tokenA, tokenB, amountTokenA, amountTokenB }: CreatePoolParams) {
		if (!provider?.providerProgram) {
			throw new Error('Please connect your wallet');
		}

		if (!publicKey) {
			throw new Error('Please connect your wallet');
		}

		if (!signAllTransactions) {
			throw new Error('Wallet does not support signAllTransactions');
		}

		const raydium = await initSdk(publicKey, signAllTransactions);
		
		// Detect token program IDs from chain metadata
		const tokenAProgramId = await getTokenProgramId(tokenA.mint);
		const tokenBProgramId = await getTokenProgramId(tokenB.mint);

		const tokenAATA = await getAssociatedTokenAddress(tokenA.mint, publicKey, false, tokenAProgramId);
		const tokenBATA = await getAssociatedTokenAddress(tokenB.mint, publicKey, false, tokenBProgramId);


		const transaction = new Transaction();
		if (!(await connection.getAccountInfo(tokenAATA))) {
            // console.log('Creating ATA for token A...');
			transaction.add(
				createAssociatedTokenAccountInstruction(
					publicKey,
					tokenAATA,
					publicKey,
					tokenA.mint,
					tokenAProgramId
				)
			);
		}

		if (!(await connection.getAccountInfo(tokenBATA))) {
            // console.log('Creating ATA for token B...');
			transaction.add(
				createAssociatedTokenAccountInstruction(
					publicKey,
					tokenBATA,
					publicKey,
					tokenB.mint,
					tokenBProgramId
				)
			);
		}

		if (transaction.instructions.length > 0) {
			const { blockhash } = await connection.getLatestBlockhash();
			transaction.recentBlockhash = blockhash;
			transaction.feePayer = publicKey;
			const simulation = await provider.connection.simulateTransaction(transaction);
			if (simulation.value.err) {
				throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
			}
			const signature = await sendTransaction(transaction, provider.connection, {
				skipPreflight: false,
				preflightCommitment: 'processed'
			});

			const confirmation = await provider.connection.confirmTransaction(signature, 'confirmed');
			if (confirmation.value.err) {
				throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
			}
		}

		const tokenAAmountBN = new BN(Math.floor(parseFloat(amountTokenA) * 10 ** tokenA.decimals).toString());
		const tokenBAmountBN = new BN(Math.floor(parseFloat(amountTokenB) * 10 ** tokenB.decimals).toString());

		const isSorted = tokenA.mint.toBuffer().compare(tokenB.mint.toBuffer()) < 0;
		const [mintA, mintB, mintAAmount, mintBAmount] = isSorted
			? [tokenA.mint, tokenB.mint, tokenAAmountBN, tokenBAmountBN]
			: [tokenB.mint, tokenA.mint, tokenBAmountBN, tokenAAmountBN];

		const feeConfig = {
			id: getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, 0).publicKey.toBase58(),
			index: 0,
			protocolFeeRate: 120000,
			tradeFeeRate: 2500,
			fundFeeRate: 40000,
			createPoolFee: '1000000',
			creatorFeeRate: 0
		};

		const { execute } = await raydium.cpmm.createPool({
			programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
			poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
			mintA: {
				address: mintA.toBase58(),
				decimals: mintA.equals(tokenA.mint) ? tokenA.decimals : tokenB.decimals,
				programId: mintA.equals(tokenA.mint)
					? tokenAProgramId.toString()
					: tokenBProgramId.toString(),
			},
			mintB: {
				address: mintB.toBase58(),
				decimals: mintB.equals(tokenA.mint) ? tokenA.decimals : tokenB.decimals,
				programId: mintB.equals(tokenA.mint)
					? tokenAProgramId.toString()
					: tokenBProgramId.toString(),
			},
			mintAAmount,
			mintBAmount,
			startTime: new BN(0),
			feeConfig,
			associatedOnly: false,
			ownerInfo: { useSOLBalance: true },
			txVersion,
		});

		const { txId } = await execute({ sendAndConfirm: true });
		return txId;
	}

	return { createPool };
}
