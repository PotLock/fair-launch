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
    getMinimumBalanceForRentExemptMint,
    getOrCreateAssociatedTokenAccount,
    createMintToInstruction,
    createInitializeMint2Instruction,
    createInitializeMintInstruction,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,

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
import { getAllocationPDAs, getPDAs } from "./utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
dotenv.config()

const mintExample = new PublicKey("24Uhd6Q9pJ9TEc561BTQpDfEucW9egYuYg9Ud4ijDKFz");
const BONDING_CURVE_PROGRAM_ID = "6qR9UPXArNpBR2m9uBfh97LXcQQQwJpKmV1ULHmxzNeW";
const BONDING_CURVE_IDL = require("../target/idl/bonding_curve.json");

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
        // const decimals = 9;

        // const createMintAccountInstruction = SystemProgram.createAccount({
        //     fromPubkey: signer.publicKey,
        //     newAccountPubkey: mint.publicKey,
        //     space: MINT_SIZE,
        //     lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        //     programId: TOKEN_PROGRAM_ID,
        // });

        // const initializeMintInstruction = createInitializeMintInstruction(
        //     mint.publicKey,
        //     decimals,
        //     signer.publicKey,
        //     signer.publicKey,
        // );

        // const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        //     {
        //         metadata: PublicKey.findProgramAddressSync(
        //             [
        //                 Buffer.from("metadata"),
        //                 PROGRAM_ID.toBuffer(),
        //                 mint.publicKey.toBuffer(),
        //             ],
        //             PROGRAM_ID,
        //         )[0],
        //         mint: mint.publicKey,
        //         mintAuthority: signer.publicKey,
        //         payer: signer.publicKey,
        //         updateAuthority: signer.publicKey,
        //     },
        //     {
        //         createMetadataAccountArgsV3: {
        //             data: {
        //                 name: tokenMetadata.name,
        //                 symbol: tokenMetadata.symbol,
        //                 uri: tokenMetadata.uri,
        //                 sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
        //                 creators: tokenMetadata.creators,
        //                 collection: tokenMetadata.collection,
        //                 uses: tokenMetadata.uses,
        //             },
        //             isMutable: true,
        //             collectionDetails: null,
        //         },
        //     }
        // );

        const associatedtoken = await getAssociatedTokenAddress(
            mintExample,
            signer.publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // let associatedTokenAccountInstruction = null;
        // let transactionInstructions = [
        //     createMintAccountInstruction,
        //     initializeMintInstruction,
        //     createMetadataInstruction
        // ];

        // try {
        //     await connection.getTokenAccountBalance(associatedtoken);
        //     console.log("Associated token account already exists");
        // } catch (error) {
        //     console.log("Creating associated token account");
        //     associatedTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        //         signer.publicKey,
        //         associatedtoken,
        //         signer.publicKey,
        //         mint.publicKey,
        //         TOKEN_PROGRAM_ID,
        //         ASSOCIATED_TOKEN_PROGRAM_ID
        //     );
        //     transactionInstructions.push(associatedTokenAccountInstruction);
        // }

        // const totalSupply = 1_000_000;

        // const mintInstruction = createMintToInstruction(
        //     mint.publicKey,
        //     associatedtoken,
        //     signer.publicKey,
        //     totalSupply * Math.pow(10, decimals)
        // );

        // transactionInstructions.push(mintInstruction);

        // console.log("Building transaction...");
        // const transaction = new Transaction().add(...transactionInstructions);


        // console.log("Sending and confirming transaction...");
        // const signature = await sendAndConfirmTransaction(
        //     connection,
        //     transaction,
        //     [signer, mint]
        // );

        // console.log(
        //     `View on Solana Explorer: https://solscan.io/tx/${signature}?cluster=devnet`
        // );
        // console.log(
        //     `Mint Address: https://solscan.io/tx/address/${mint.publicKey.toBase58()}?cluster=devnet`
        // );


        // @ts-ignore
        const initializeInstruction = await initializeBondingCurve(program, mint.publicKey, signer);

        const createAllocationsInstructions = await createAllocations(program, mint.publicKey, [team.publicKey, advisor.publicKey], signer);


        const transaction = new Transaction().add(initializeInstruction, ...createAllocationsInstructions);

        const signature = await provider.sendAndConfirm(transaction, [signer]);
        console.log("Transaction signature:", signature);

    } catch (error) {
        console.error("Error:", error);
    }
}

async function initializeBondingCurve(program: Program<BondingCurve>, mint: PublicKey, signer: Keypair): Promise<TransactionInstruction> {

    const { curveConfig } = await getPDAs(signer.publicKey, mint, program.programId);

    // Fee Percentage : 100 = 1%
    const feePercentage = new BN(100);
    const initialQuorum = new BN(500);
    const targetLiquidity = new BN(1000000000);
    const daoQuorum = new BN(500);
    // 0 is linear, 1 is quadratic
    const bondingCurveType = 0;
    const maxTokenSupply = new BN(10000000000);
    const liquidityLockPeriod = new BN(60); // 30 days
    const liquidityPoolPercentage = new BN(50); // 50%
    const initialReserve = new BN(100000000); // 0.1 SOL
    const initialSupply = new BN(100000000); // 100 SPL tokens with 6 decimals 
    const reserveRatio = new BN(5000); // 50%
    let recipients = [
        {
            address: signer.publicKey,
            share: 10000,
            amount: new BN(0),
            lockingPeriod: new BN(60000),
        },
    ]
    // @ts-ignore
    const initializeInstruction = await program.methods.initialize(signer.publicKey, initialQuorum, feePercentage, targetLiquidity, signer.publicKey, daoQuorum, bondingCurveType, maxTokenSupply, liquidityLockPeriod, liquidityPoolPercentage, initialReserve, initialSupply, recipients, reserveRatio)
        .accountsStrict({

            bondingCurveConfiguration: curveConfig,
            admin: signer.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId
        })
        .instruction();

    return initializeInstruction;

}

async function createAllocations(program: Program<BondingCurve>, mint: PublicKey, wallets: PublicKey[], signer: Keypair): Promise<TransactionInstruction[]> {

    const { allocations, allocationTokenAccounts } = getAllocationPDAs(mint, wallets, program.programId);

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


    const instructions = []
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

        instructions.push(createAllocationInstruction)
    }

    return instructions;




}







main();