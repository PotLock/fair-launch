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
    const mintExample = new PublicKey("9QXB2HnQG4nyXm6YfW7hagCuA2yRt8iG8CJc5fQX1C8");


    try {

        await deleteAll(program, signer, mintExample, team, advisor);

    } catch (error) {
        console.error("Error:", error);
    }
}


async function deleteAll(program, signer, mint, team, advisor) {
    console.log("\n=== Deleting Accounts ===");
    // Get all relevant PDAs
    const { bondingCurve, curveConfig, poolTokenAccount } = await getPDAs(signer.publicKey, signer.publicKey, mint.publicKey, program.programId);
    const { allocations, allocationTokenAccounts } = getAllocationPDAs(mint.publicKey, [team.publicKey, advisor.publicKey], program.programId);
    const { launchpad, fairLaunchData, launchpadTokenAccount } = getFairLaunchPDAs(signer.publicKey, mint.publicKey, signer.publicKey, program.programId);

    // 1. Delete BondingCurve
    try {
        await program.methods.deleteBondingCurve().accountsStrict({
            bondingCurve: bondingCurve,
            receiver: signer.publicKey,
        }).rpc();
        console.log("Deleted BondingCurve");
    } catch (e) { console.error("Failed to delete BondingCurve:", e); }

    // 2. Delete CurveConfiguration
    try {
        await program.methods.deleteCurveConfiguration().accountsStrict({
            curveConfiguration: curveConfig,
            receiver: signer.publicKey,
        }).rpc();
        console.log("Deleted CurveConfiguration");
    } catch (e) { console.error("Failed to delete CurveConfiguration:", e); }

    // 3. Delete Allocations
    for (const allocation of allocations) {
        try {
            await program.methods.deleteAllocation().accountsStrict({
                allocation: allocation,
                receiver: signer.publicKey,
            }).rpc();
            console.log("Deleted Allocation", allocation.toBase58());
        } catch (e) { console.error("Failed to delete Allocation", allocation.toBase58(), e); }
    }

    // 4. Delete LaunchPadAccount
    try {
        await program.methods.deleteLaunchpadAccount().accountsStrict({
            launchpadAccount: launchpad,
            receiver: signer.publicKey,
        }).rpc();
        console.log("Deleted LaunchPadAccount");
    } catch (e) { console.error("Failed to delete LaunchPadAccount:", e); }

    // 5. Delete FairLaunchData
    try {
        await program.methods.deleteFairLaunchData().accountsStrict({
            fairLaunchData: fairLaunchData,
            receiver: signer.publicKey,
        }).rpc();
        console.log("Deleted FairLaunchData");
    } catch (e) { console.error("Failed to delete FairLaunchData:", e); }

    // 6. Delete Vaults (SPL Token Accounts)
    // Example: poolTokenAccount (authority = bondingCurve, seeds = [bondingCurve pubkey])
    try {
        const vaultSeeds = [
            Buffer.from("bonding_curve"), // Replace with your actual seed string for the vault PDA
            mint.publicKey.toBuffer(),
        ];
        await program.methods.deleteVault(vaultSeeds.map(b => Array.from(b))).accountsStrict({
            vault: poolTokenAccount,
            vaultAuthority: bondingCurve,
            receiver: signer.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc();
        console.log("Deleted PoolTokenAccount Vault");
    } catch (e) { console.error("Failed to delete PoolTokenAccount Vault:", e); }

    // Example: allocationVaults (authority = allocation PDA, seeds = [ALLOCATION_SEED_PREFIX, wallet pubkey])
    for (let i = 0; i < allocations.length; i++) {
        try {
            const allocationVault = allocationTokenAccounts[i];
            const allocationPDA = allocations[i];
            const vaultSeeds = [
                Buffer.from("allocation"), // Replace with your actual seed string for allocation vault PDA
                team.publicKey.toBuffer(), // or advisor.publicKey for the second
            ];
            await program.methods.deleteVault(vaultSeeds.map(b => Array.from(b))).accountsStrict({
                vault: allocationVault,
                vaultAuthority: allocationPDA,
                receiver: signer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).rpc();
            console.log("Deleted AllocationVault", allocationVault.toBase58());
        } catch (e) { console.error("Failed to delete AllocationVault", allocationTokenAccounts[i].toBase58(), e); }
    }

    // Example: launchpadTokenAccount (authority = launchpad PDA, seeds = [LAUNCHPAD_SEED_PREFIX, authority pubkey])
    try {
        const vaultSeeds = [
            Buffer.from("launchpad"), // Replace with your actual seed string for launchpad vault PDA
            signer.publicKey.toBuffer(),
        ];
        await program.methods.deleteVault(vaultSeeds.map(b => Array.from(b))).accountsStrict({
            vault: launchpadTokenAccount,
            vaultAuthority: launchpad,
            receiver: signer.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc();
        console.log("Deleted LaunchpadVault");
    } catch (e) { console.error("Failed to delete LaunchpadVault:", e); }
}

main();