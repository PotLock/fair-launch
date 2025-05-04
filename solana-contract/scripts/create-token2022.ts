import { createV1, mintV1, Collection, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionDataArgs, Creator, MPL_TOKEN_METADATA_PROGRAM_ID, Uses, createMetadataAccountV3, updateMetadataAccountV2, findMetadataPda, CreateV1InstructionAccounts, CreateV1InstructionData, TokenStandard, CollectionDetails, PrintSupply, Data, createFungible, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import { PublicKey, createSignerFromKeypair, generateSigner, keypairIdentity, none, percentAmount, publicKey, signerIdentity, some, transactionBuilder } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import * as bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { AuthorityType, createTokenIfMissing, findAssociatedTokenPda, getSplAssociatedTokenProgramId, mintTokensTo, setAuthority, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox'
import dotenv from "dotenv"
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
dotenv.config()

const SPL_TOKEN_2022_PROGRAM_ID: PublicKey = publicKey(
    TOKEN_2022_PROGRAM_ID.toBase58()
);

async function createToken2022() {


    const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());
    const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.SIGNER_PRIVATE_KEY));
    const owner = createSignerFromKeypair(umi, keypair);

    umi.use(keypairIdentity(owner))
    console.log("Public Key", keypair.publicKey);
    const mintSigner = generateSigner(umi);
    console.log("Mint Signer", mintSigner.publicKey);

    const metadata = {
        name: "Fair Launch Token",
        symbol: "FLT",
        uri: "https://gray-left-duck-68.mypinata.cloud/ipfs/bafkreieezx4pg42s2symhlc4jybdovwjjnj5a7wzzck47p4pstqwgwwf7q",
    }


    let createFungibleIx = createFungible(umi, {
        name: metadata.name,
        uri: metadata.uri,
        symbol: metadata.symbol,
        splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: 6,
        mint: mintSigner,
    });

    const token = findAssociatedTokenPda(umi, {
        mint: mintSigner.publicKey,
        owner: umi.identity.publicKey,
        tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
    });

    console.log("Token Account", token[0]);
    // The final instruction (if required) is to mint the tokens to the token account in the previous ix.
    const mintTokensIx = mintV1(umi, {
        mint: mintSigner.publicKey,
        token,
        splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
        tokenStandard: TokenStandard.Fungible,
        tokenOwner: umi.identity.publicKey,
        amount: 10000 * Math.pow(10, 6),
    })

    // The last step is to send the ix's off in a transaction to the chain.
    console.log("Sending transaction")
    const tx = await
        transactionBuilder()
            .add(setComputeUnitPrice(umi, { microLamports: 1000000 }))
            .add(createFungibleIx)
            .add(mintTokensIx)
            // .add(setAuthority(umi, {
            //     owned: mintSigner.publicKey,
            //     owner: umi.identity.publicKey,
            //     authorityType: AuthorityType.MintTokens,
            //     newAuthority: null
            // }))
            // .add(setAuthority(umi, {
            //     owned: mintSigner.publicKey,
            //     owner: umi.identity.publicKey,
            //     authorityType: AuthorityType.FreezeAccount,
            //     newAuthority: null
            // }))
            .sendAndConfirm(umi);

    const signature = bs58.deserialize(tx.signature)[0];
    console.log("Signature", signature)

}

createToken2022()