import {
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
    PublicKey,
    TransactionInstruction,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
    createMintToInstruction,
    createInitializeMintInstruction,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,

} from "@solana/spl-token";
import {
    createCreateMetadataAccountV3Instruction,
    PROGRAM_ID as METADATA_PROGRAM_ID,
    PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import * as bs58 from "bs58";
import dotenv from "dotenv"
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { BondingCurve } from "../target/types/bonding_curve";
import { getAllocationPDAs, getFairLaunchPDAs, getPDAs } from "./utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
dotenv.config()


const BONDING_CURVE_IDL = require("../target/idl/bonding_curve.json");

const TX_INTERVAL = 1000;



async function main() {
    const connection = new Connection("https://api.devnet.solana.com", {
        commitment: "confirmed",
    });
    const signer = Keypair.fromSecretKey(bs58.decode(process.env.SIGNER_PRIVATE_KEY))

    const wallet = new anchor.Wallet(signer);

    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    anchor.setProvider(provider);

    const program = new Program(BONDING_CURVE_IDL, provider);
    console.log("Program:", program.programId.toBase58());

    console.log("Signer:", signer.publicKey.toBase58());
    const user1 = Keypair.fromSecretKey(bs58.decode(process.env.USER_PRIVATE_KEY))
    const team = Keypair.fromSecretKey(bs58.decode(process.env.TEAM_PRIVATE_KEY))
    const advisor = Keypair.fromSecretKey(bs58.decode(process.env.ADVISOR_PRIVATE_KEY))

    const mint = Keypair.generate();
    console.log("New token mint public key:", mint.publicKey.toBase58());

    const tokenMetadata = {
        name: "Fair Launch Token",
        symbol: "FLT",
        uri: "https://gray-left-duck-68.mypinata.cloud/ipfs/bafkreieezx4pg42s2symhlc4jybdovwjjnj5a7wzzck47p4pstqwgwwf7q",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
    };

    try {
        // Generate all transactions first
        const transactionList = await generateTransactions(
            connection,
            program,
            signer,
            mint,
            tokenMetadata,
            [team.publicKey, advisor.publicKey],
            provider
        );

        console.log(`Initiating bulk transaction execution for ${transactionList.length} transactions`);
        const txResults = await executeTransactions(connection, transactionList, signer, mint);
        console.log("\n=== Transaction Results ===");
        txResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Transaction ${index + 1}: ${result.value}`);
            } else {
                console.log(`Transaction ${index + 1} failed:`, result.reason);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

async function generateTransactions(
    connection: Connection,
    program: Program<BondingCurve>,
    signer: Keypair,
    mint: Keypair,
    tokenMetadata: any,
    allocationWallets: PublicKey[],
    provider: anchor.AnchorProvider
): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    const { blockhash } = await connection.getLatestBlockhash();

    const tokenTransaction = await createTokenTransaction(connection, signer, mint, tokenMetadata);
    tokenTransaction.recentBlockhash = blockhash;
    tokenTransaction.feePayer = signer.publicKey;
    tokenTransaction.partialSign(signer, mint);
    transactions.push(tokenTransaction);

    const bondingCurveTransaction = await createBondingCurveTransaction(program, mint.publicKey, signer);
    bondingCurveTransaction.recentBlockhash = blockhash;
    bondingCurveTransaction.feePayer = signer.publicKey;
    bondingCurveTransaction.partialSign(signer);
    transactions.push(bondingCurveTransaction);

    const allocationTransactions = await createAllocationTransactions(program, mint.publicKey, allocationWallets, signer);
    allocationTransactions.forEach(tx => {
        tx.recentBlockhash = blockhash;
        tx.feePayer = signer.publicKey;
        tx.partialSign(signer);
    });
    transactions.push(...allocationTransactions);

    const fairLaunchTransaction = await createFairLaunchTransaction(program, mint.publicKey, signer);
    fairLaunchTransaction.recentBlockhash = blockhash;
    fairLaunchTransaction.feePayer = signer.publicKey;
    fairLaunchTransaction.partialSign(signer);
    transactions.push(fairLaunchTransaction);

    const liquidityPoolTransaction = await createLiquidityPoolTransaction(program, mint.publicKey, signer);
    liquidityPoolTransaction.recentBlockhash = blockhash;
    liquidityPoolTransaction.feePayer = signer.publicKey;
    liquidityPoolTransaction.partialSign(signer);
    transactions.push(liquidityPoolTransaction);

    transactions.forEach((tx, index) => {
        const size = tx.serialize().length;
        console.log(`Transaction ${index + 1} size: ${size} bytes`);
        if (size > 1232) {
            console.warn(`Transaction ${index + 1} approaching size limit!`);
        }
    });

    return transactions;
}

async function createTokenTransaction(
    connection: Connection,
    signer: Keypair,
    mint: Keypair,
    tokenMetadata: any
): Promise<Transaction> {
    const decimals = 9;

    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
    });

    const initializeMintInstruction = createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        signer.publicKey,
        signer.publicKey,
    );

    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    PROGRAM_ID.toBuffer(),
                    mint.publicKey.toBuffer(),
                ],
                PROGRAM_ID,
            )[0],
            mint: mint.publicKey,
            mintAuthority: signer.publicKey,
            payer: signer.publicKey,
            updateAuthority: signer.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    name: tokenMetadata.name,
                    symbol: tokenMetadata.symbol,
                    uri: tokenMetadata.uri,
                    sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
                    creators: tokenMetadata.creators,
                    collection: tokenMetadata.collection,
                    uses: tokenMetadata.uses,
                },
                isMutable: true,
                collectionDetails: null,
            },
        }
    );

    const associatedtoken = await getAssociatedTokenAddress(
        mint.publicKey,
        signer.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const associatedTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        signer.publicKey,
        associatedtoken,
        signer.publicKey,
        mint.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const totalSupply = 1_000_000;
    const mintInstruction = createMintToInstruction(
        mint.publicKey,
        associatedtoken,
        signer.publicKey,
        totalSupply * Math.pow(10, 9)
    );

    return new Transaction().add(
        createMintAccountInstruction,
        initializeMintInstruction,
        createMetadataInstruction,
        associatedTokenAccountInstruction,
        mintInstruction
    );
}

async function createBondingCurveTransaction(
    program: Program<BondingCurve>,
    mint: PublicKey,
    signer: Keypair
): Promise<Transaction> {
    const { curveConfig } = await getPDAs(signer.publicKey, signer.publicKey, mint, program.programId);

    const feePercentage = 100;
    const initialQuorum = new BN(500);
    const targetLiquidity = new BN(1000000000);
    const daoQuorum = 500;
    const bondingCurveType = 0;
    const maxTokenSupply = new BN(10000000000);
    const liquidityLockPeriod = new BN(60);
    const liquidityPoolPercentage = 50;
    const initialReserve = new BN(100000000);
    const initialSupply = new BN(100000000);
    const reserveRatio = 5000;
    let recipients = [
        {
            address: signer.publicKey,
            share: 10000,
            amount: new BN(0),
            lockingPeriod: new BN(60000),
        },
    ]

    const initializeInstruction = await program.methods
        .initialize(signer.publicKey, feePercentage, initialQuorum, targetLiquidity, signer.publicKey, daoQuorum, bondingCurveType, maxTokenSupply, liquidityLockPeriod, liquidityPoolPercentage, initialReserve, initialSupply, recipients, reserveRatio)
        .accountsStrict({
            bondingCurveConfiguration: curveConfig,
            admin: signer.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId
        })
        .instruction();

    return new Transaction().add(initializeInstruction);
}

async function createAllocationTransactions(
    program: Program<BondingCurve>,
    mint: PublicKey,
    wallets: PublicKey[],
    signer: Keypair
): Promise<Transaction[]> {
    const { allocations, allocationTokenAccounts } = getAllocationPDAs(mint, wallets, program.programId);
    console.log("Allocation wallets:", wallets);
    console.log("Allocation's accounts:", allocations);
    const transactions: Transaction[] = [];

    let percentage = new BN(10)
    let totalTokens = new BN(1000000000000)
    let currentTime = Math.floor(Date.now() / 1000);
    let startTime = new BN(currentTime).add(new BN(1000));
    let cliffPeriod = new BN(1000);
    let duration = new BN(1000);
    let interval = new BN(1000);
    let released = new BN(0);

    let vesting = {
        cliffPeriod: cliffPeriod,
        startTime: startTime,
        duration: duration,
        interval: interval,
        released: released,
    }


    for (let i = 0; i < wallets.length; i++) {
        const createAllocationInstruction = await program.methods
            .createAllocation("Team", percentage.toNumber(), totalTokens, vesting)
            .accountsStrict({
                allocation: allocations[i],
                wallet: wallets[i],
                tokenMint: mint,
                allocationVault: allocationTokenAccounts[i],
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                authority: signer.publicKey,
            })
            .instruction()

        transactions.push(new Transaction().add(createAllocationInstruction));
    }

    return transactions;
}

async function createFairLaunchTransaction(
    program: Program<BondingCurve>,
    mint: PublicKey,
    signer: Keypair
): Promise<Transaction> {
    const { launchpad, fairLaunchData, launchpadTokenAccount, contributionVault } = getFairLaunchPDAs(signer.publicKey, mint, signer.publicKey, program.programId);

    let softCap = new BN(1_000_000_000);
    let hardCap = new BN(10_000_000_000);
    let minContribution = new BN(100_000_000);
    let maxContribution = new BN(2_000_000_000);
    let maxTokensPerWallet = new BN(1000);
    let distributionDelay = new BN(3600);
    let currentTime = Math.floor(Date.now() / 1000);
    let startTime = new BN(currentTime + 60);
    let endTime = new BN(currentTime + 3600);

    const createFairLaunchInstruction = await program.methods
        .createFairLaunch(
            softCap,
            hardCap,
            startTime,
            endTime,
            minContribution,
            maxContribution,
            maxTokensPerWallet,
            distributionDelay
        )
        .accountsStrict({
            launchPadAccount: launchpad,
            fairLaunchData: fairLaunchData,
            tokenMint: mint,
            launchpadVault: launchpadTokenAccount,
            contributionVault: contributionVault,
            authority: signer.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

    return new Transaction().add(createFairLaunchInstruction);
}

async function createLiquidityPoolTransaction(
    program: Program<BondingCurve>,
    mint: PublicKey,
    signer: Keypair
): Promise<Transaction> {
    const { curveConfig, bondingCurve, poolTokenAccount, poolSolVault, userTokenAccount } = await getPDAs(signer.publicKey, signer.publicKey, mint, program.programId);
    const createLiquidityPoolInstruction = await program.methods
        .createPool()
        .accountsStrict({
              bondingCurveConfiguration: curveConfig,
              bondingCurveAccount: bondingCurve,
              tokenMint: mint,
              poolTokenAccount: poolTokenAccount,
              poolSolVault: poolSolVault,
              userTokenAccount: userTokenAccount,
              user: signer.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
        })
        .instruction();
    return new Transaction().add(createLiquidityPoolInstruction);


}


async function executeTransactions(
    solanaConnection: Connection, 
    transactionList: Transaction[], 
    payer: Keypair,
    mint?: Keypair
): Promise<PromiseSettledResult<string>[]> {
    let result: PromiseSettledResult<string>[] = [];
    
    let staggeredTransactions: Promise<string>[] = transactionList.map((transaction, i, allTx) => {
        return (new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log(`Requesting Transaction ${i + 1}/${allTx.length}`);
                solanaConnection.getLatestBlockhash()
                    .then(recentHash => transaction.recentBlockhash = recentHash.blockhash)
                    .then(() => {
                        const signers = i === 0 && mint ? [payer, mint] : [payer];
                        return sendAndConfirmTransaction(solanaConnection, transaction, signers);
                    })
                    .then(resolve)
                    .catch(reject);
            }, i * TX_INTERVAL);
        }));
    });

    result = await Promise.allSettled(staggeredTransactions);
    return result;
}

main();