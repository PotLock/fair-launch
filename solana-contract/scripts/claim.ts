// Check claim by mutisig account 

import * as anchor from '@coral-xyz/anchor';
import {
    Connection as solanaConnection,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
    SystemProgram
} from '@solana/web3.js';
import idl from "../target/idl/bonding_curve.json";
import * as multisig from '@sqds/multisig';
const fs = require('fs');
import 'dotenv/config';
import os from 'os';
import { getKeypairFromFile, getPDAs } from './utils';
const BONDING_CURVE_PROGRAM_ID = new PublicKey("3fdhpiNWfrz4MrQsoPgjkML5kiBgc9thUpxjd8KDEcf6");
const MINT = new PublicKey("BU38GveW5z5N61kuazeSJSPJCcQt9fn4SYZboBCxBVpz");
(async () => {



    // TODO: needs to be token owner & creator of the Squads multisig
    // 1 of owner of the multisig
    const payer = getKeypairFromFile(`${os.homedir()}/.config/solana/id.json`);
    const user = getKeypairFromFile(`${os.homedir()}/.config/solana/id2.json`);
    console.log("Payer:", payer.publicKey.toBase58());

    const solanaCon = new solanaConnection('https://api.devnet.solana.com');
    // Creator get from create-multisig.ts script
    const creator = new PublicKey("G7uL2m3YLg2oBzGWcGih6iJH3MLpNgyRqj3rCXnK7GX8");
    const [multisigPda] = multisig.getMultisigPda({
        createKey: creator,
      });

    console.log("Multisig PDA:", multisigPda.toBase58());

    const bpfLoaderUpgradeableProgramPublicKey = new PublicKey(
		'BPFLoaderUpgradeab1e11111111111111111111111'
	);
	const [programDataPublicKey, _programDataBump] = await PublicKey.findProgramAddressSync(
		[BONDING_CURVE_PROGRAM_ID.toBuffer()],
		bpfLoaderUpgradeableProgramPublicKey    
	);
    console.log("Program Data Public Key:", programDataPublicKey.toBase58());

    const anchorConnection = new anchor.web3.Connection(
		anchor.web3.clusterApiUrl('devnet'),
		'confirmed'
	);
	const wallet = new anchor.Wallet(payer);
	const provider = new anchor.AnchorProvider(anchorConnection, wallet, {
		preflightCommitment: 'confirmed',
	});
	anchor.setProvider(provider);

	const program = new anchor.Program(idl as anchor.Idl, provider);


    // Get deserialized multisig account info
	const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
		solanaCon,
		multisigPda
	);
    console.log("Multisig Info:", multisigInfo);



    const { curveConfig, bondingCurve, feePool, feePoolVault, feePoolVaultBump }= await getPDAs(payer.publicKey, MINT, BONDING_CURVE_PROGRAM_ID);
    console.log("Curve Config:", curveConfig.toBase58());
    console.log("Bonding Curve:", bondingCurve.toBase58());
    console.log("Fee Pool:", feePool.toBase58());
    console.log("Fee Pool Vault:", feePoolVault.toBase58());
    console.log("Fee Pool Vault Bump:", feePoolVaultBump);


    const transactionIndex = multisig.utils.toBigInt(multisigInfo.transactionIndex) + BigInt(1);

    const vaultIndex = 0;
    // Default vault, index 0.
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: vaultIndex,
    });
    const [proposalPda] = multisig.getProposalPda({
      multisigPda,
      transactionIndex,
    });
  
    const [transactionPda] = multisig.getTransactionPda({
      multisigPda,
      index: transactionIndex,
    });

    const { blockhash, lastValidBlockHeight } = await solanaCon.getLatestBlockhash();

    const instructionClaim = await program.methods.claimFee(feePoolVaultBump).accounts({
        dexConfigurationAccount: curveConfig,
        bondingCurve: bondingCurve,
        feePool: feePool,
        feePoolVault: feePoolVault,
        tokenMint: MINT,
        user: vaultPda,
        systemProgram: SystemProgram.programId
    }).instruction();



    const transactionMessage = new TransactionMessage({
        instructions: [
            instructionClaim
        ],
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
      });

    const createTransactionIx = multisig.instructions.vaultTransactionCreate({
        multisigPda,
        transactionIndex,
        vaultIndex,
        /** Number of additional signing PDAs required by the transaction. */
        ephemeralSigners: 2,
        /** Transaction message to wrap into a multisig transaction. */
        transactionMessage,
        /** `AddressLookupTableAccount`s referenced in `transaction_message`. */
        // addressLookupTableAccounts?: AddressLookupTableAccount[];
        memo: 'Claim fee',
        creator: payer.publicKey,
        rentPayer: payer.publicKey,
    });

    const createProposalIx = multisig.instructions.proposalCreate({
        multisigPda,
        transactionIndex,
        creator: payer.publicKey,
      });
    
      const approveProposalIx1 = multisig.instructions.proposalApprove({
        multisigPda,
        transactionIndex,
        member: payer.publicKey,
      });
    
      const approveProposalIx2 = multisig.instructions.proposalApprove({
        multisigPda,
        transactionIndex,
        member: user.publicKey,
      });

      const executeTransactionIx = multisig.generated.createVaultTransactionExecuteInstruction({
        multisig: multisigPda,
        member: payer.publicKey,
        proposal: proposalPda,
        transaction: transactionPda,
        // anchorRemainingAccounts: [],
      });

      const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
        instructions: [
          createTransactionIx, // create transaction
          createProposalIx, // proposal transaction
          approveProposalIx1, // approve transaction
          approveProposalIx2, // approve transaction
          executeTransactionIx, // execute transaction
        ],
      }).compileToV0Message();


      const tx = new VersionedTransaction(message);

      tx.sign([payer, user]);
    
      const signature = await solanaCon.sendTransaction(tx);
      console.log('signature : ', signature);
      await solanaCon.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      
      // Verify the multisig account.
    
      const newTransactionIndex = multisigInfo.transactionIndex;
    
      console.log('transactionIndex: ', newTransactionIndex);



})();

