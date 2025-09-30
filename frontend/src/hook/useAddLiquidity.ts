import { DEVNET_PROGRAM_ID, getCpmmPdaAmmConfigId, Percent } from '@raydium-io/raydium-sdk-v2';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { connection, initSdk, txVersion } from '../configs/raydium';
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
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

export interface AddLiquidityParams {
	amountInput: string,
	slippageInput: number,
	baseIn: boolean,
	poolIdInput: string,
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

	async function addLiquidity({amountInput, slippageInput, baseIn, poolIdInput}:AddLiquidityParams) {
		if (!provider?.providerProgram) {
			throw new Error('Please connect your wallet');
		}

		if (!publicKey) {
			throw new Error('Please connect your wallet');
		}

		if (!signAllTransactions) {
			throw new Error('Wallet does not support signAllTransactions');
		}

		try{
			const slippage = new Percent(Number(slippageInput), 100);
	
			console.log(`\n=== User Input ===`);
			console.log(`Input Amount: ${amountInput}`);
			console.log(`Base In : ${baseIn ? "WSOL" : "Custom Token"}`);
			console.log(`Slippage: ${slippageInput}%`);
			console.log("==================\n");
	
			const raydium = await initSdk();
			const poolId = new PublicKey(poolIdInput);
			const pool = await raydium.cpmm.getPoolInfoFromRpc(poolId.toString());	
	
			if (!pool || pool.poolInfo.type !== 'Standard') {
				throw new Error('CPMM pool not found.');
			}
	
			const poolInfo = {
				...pool.poolInfo,
				authority: pool.poolKeys.authority,
				config: { ...pool.poolInfo.config },
			};
	
			console.log('=== Pool Info ===');
			console.dir(poolInfo, { depth: null });
	
			if (!pool.poolKeys?.authority) throw new Error('Pool authority is undefined.');
			if (pool.rpcData.baseReserve.isZero() || pool.rpcData.quoteReserve.isZero()) {
				throw new Error('Pool has no initial liquidity.');
			}
	
			const mintA = new PublicKey(poolInfo.mintA.address);
			const mintB = new PublicKey(poolInfo.mintB.address);
			
			const ataA = await getAssociatedTokenAddress(
				mintA,
				publicKey,
				false,
				poolInfo.mintA.programId === TOKEN_2022_PROGRAM_ID.toString()
					? TOKEN_2022_PROGRAM_ID
					: TOKEN_PROGRAM_ID
			);
			const ataB = await getAssociatedTokenAddress(
				mintB,
				publicKey,
				false,
				poolInfo.mintB.programId === TOKEN_2022_PROGRAM_ID.toString()
					? TOKEN_2022_PROGRAM_ID
					: TOKEN_PROGRAM_ID
			);
	
			const transaction = new Transaction();
	
			// check ATA mintA
			const ataAInfo = await connection.getAccountInfo(ataA);
			if (!ataAInfo) {
				transaction.add(
					createAssociatedTokenAccountInstruction(
					publicKey,
					ataA,
					publicKey,
					mintA,
					poolInfo.mintA.programId === TOKEN_2022_PROGRAM_ID.toString()
						? TOKEN_2022_PROGRAM_ID
						: TOKEN_PROGRAM_ID
					)
				);
			}
	
			// check ATA mintB
			const ataBInfo = await connection.getAccountInfo(ataB);
			if (!ataBInfo) {
				transaction.add(
					createAssociatedTokenAccountInstruction(
					publicKey,
					ataB,
					publicKey,
					mintB,
					poolInfo.mintB.programId === TOKEN_2022_PROGRAM_ID.toString()
						? TOKEN_2022_PROGRAM_ID
						: TOKEN_PROGRAM_ID
					)
				);
			}
		
			if (poolInfo.mintA.symbol === 'WSOL' || poolInfo.mintB.symbol === 'WSOL') {
				const wsolATA = poolInfo.mintA.symbol === 'WSOL' ? ataA : ataB;
				console.log(`Wrapping ${amountInput} SOL into WSOL...`);
				transaction.add(
					SystemProgram.transfer({
					fromPubkey: publicKey,
					toPubkey: wsolATA,
					lamports: new BN(Math.floor(parseFloat(amountInput) * 1e9)).toNumber(),
					}),
					createSyncNativeInstruction(wsolATA)
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
	
			// const accountA = await getAccount(
			// 	connection,
			// 	ataA,
			// 	'confirmed',
			// 	poolInfo.mintA.programId === TOKEN_2022_PROGRAM_ID.toString()
			// 		? TOKEN_2022_PROGRAM_ID
			// 		: TOKEN_PROGRAM_ID
			// );
	
			// const accountB = await getAccount(
			// 	connection,
			// 	ataB,
			// 	'confirmed',
			// 	poolInfo.mintB.programId === TOKEN_2022_PROGRAM_ID.toString()
			// 		? TOKEN_2022_PROGRAM_ID
			// 		: TOKEN_PROGRAM_ID
			// );
	
			console.log('Sending add liquidity transaction...');
			const addLiquidityResult = await raydium.cpmm.addLiquidity({
				poolInfo,
				poolKeys: pool.poolKeys,
				inputAmount: new BN(Math.floor(parseFloat(amountInput) * 1e9)),
				baseIn,
				slippage,
				config: {
					bypassAssociatedCheck: false,
					checkCreateATAOwner: true,
				},
				txVersion,
			});
	
			const { execute } = addLiquidityResult;
			const { txId } = await execute({ sendAndConfirm: true });
			console.log('Liquidity added! TxId:', txId);
		}catch(error){
			throw new Error(error instanceof Error ? error.message : 'Unknown error');
			console.error(error);
		}

	}

	return { createPool, addLiquidity };
}
