// import { Keypair, Transaction } from "@solana/web3.js";
// import { logger } from "../src/solana/logger";
// import { checkIfPoolExists, createPool } from "../src/solana/lp";
// import { loadWalletKey } from "../src/solana/utils";

// const TOKEN_A = "2pJyUKiUeuTcQXQiHpaYauiV6sZig9voRhF9RoSUs4mq";
// const TOKEN_B = "3EhLf4PVfBsnETyLTRMhzH1ph5ysHSDniANe6SuB3LJg";

// const WALLET_PATH = "/home/brightscript001/my-solana-wallet.json";

// async function main() {
//   try {
//     logger.info("Loading wallet...");
//     const walletKeypair: Keypair = loadWalletKey(WALLET_PATH);

//     const wallet = {
//       publicKey: walletKeypair.publicKey,
//       signTransaction: async (tx: Transaction) => {
//         tx.partialSign(walletKeypair);
//         return tx;
//       },
//       signAllTransactions: async (txs: Transaction[]) => {
//         txs.forEach((tx: Transaction) => tx.partialSign(walletKeypair));
//         return txs;
//       },
//     };

//     logger.info("Checking if pool exists...", { tokenA: TOKEN_A, tokenB: TOKEN_B });
//     const exists = await checkIfPoolExists(TOKEN_A, TOKEN_B);
//     logger.info(`Pool exists? ${exists}`);

//     if (!exists) {
//       logger.info("Pool does not exist. Creating pool...");
//       const result = await createPool(TOKEN_A, TOKEN_B, wallet);

//       if (result.status === "success") {
//         logger.info("Pool created successfully!", {
//           signature: result.signature,
//           poolId: result.poolId?.toBase58(),
//         });
//       } else {
//         logger.error("Failed to create pool", { error: result.error });
//       }
//     } else {
//       logger.info("Skipping pool creation since it already exists.");
//     }
//   } catch (err) {
//     logger.error("Error running pool test", {
//       error: err instanceof Error ? err.message : String(err),
//     });
//   }
// }

// main();
