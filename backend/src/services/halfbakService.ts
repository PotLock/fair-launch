import { type DbcConfig, LaunchClient} from "@cookedbusiness/halfbaked-sdk";
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "../lib/sol";
import type { DbcConfigRequest, DeployTokenRequest } from "../types";
import { getDBCConfig } from "../configs/dbc.config";
import { NATIVE_MINT } from "@solana/spl-token";
import { toSdkMetadata } from "../lib/halfbak";

export class HalfbakService {
    private launchClient: LaunchClient;
    private connection: Connection;

    constructor() {
        this.connection = new Connection(getRpcSOLEndpoint());
        this.launchClient = new LaunchClient(this.connection);
    }

    async createDbcConfig(dbcConfigRequest: DbcConfigRequest) {
      const metadata = toSdkMetadata(dbcConfigRequest.metadata);

      // 1️⃣ Build DBC config object
      const dbcConfig: DbcConfig = getDBCConfig(
        dbcConfigRequest.signer,
        dbcConfigRequest.metadata.name,
        dbcConfigRequest.metadata.symbol,
        metadata
      );
    
      const quoteMint = new PublicKey(NATIVE_MINT.toString());
      const dbcConfigKeypair = Keypair.generate();
    
      // 2️⃣ Build transaction via SDK
      const dbcConfigTransaction = await this.launchClient.createDbcConfig(
        dbcConfig,
        dbcConfigRequest.signer,
        dbcConfigKeypair,
        quoteMint
      );
    
      const latestBlockhash = await this.connection.getLatestBlockhash();

      if (dbcConfigTransaction instanceof VersionedTransaction) {
        // Rebuild message with new blockhash
        const message = TransactionMessage.decompile(dbcConfigTransaction.message);
        message.recentBlockhash = latestBlockhash.blockhash;
      
        // Create new versioned tx
        const newTx = new VersionedTransaction(message.compileToV0Message());
        return {
          dbcConfigKeypair,
          dbcConfigTransaction: Buffer.from(newTx.serialize()).toString("base64"),
        };
      } else {
        // Normal Transaction
        dbcConfigTransaction.recentBlockhash = latestBlockhash.blockhash;
        dbcConfigTransaction.feePayer = dbcConfigRequest.signer;
        dbcConfigTransaction.partialSign(dbcConfigKeypair);
        const serializedTx = dbcConfigTransaction
          .serialize({ requireAllSignatures: false })
          .toString("base64");
        return {
          dbcConfigKeypair,
          dbcConfigTransaction: serializedTx,
        };
      }
    }

    async deployToken(deployTokenRequest: DeployTokenRequest){
      const metadata = toSdkMetadata(deployTokenRequest.metadata);

      const dbcConfig: DbcConfig = getDBCConfig(
        deployTokenRequest.signer,
        deployTokenRequest.metadata.name,
        deployTokenRequest.metadata.symbol,
        metadata
      );

      const baseMint = Keypair.generate();

      const txCreateToken = await this.launchClient.deployToken(dbcConfig,deployTokenRequest.signer, baseMint, deployTokenRequest.dbcConfigKeypair);
      
      const latestBlockhash = await this.connection.getLatestBlockhash();

      // Normal Transaction
      txCreateToken.recentBlockhash = latestBlockhash.blockhash;
      txCreateToken.feePayer = deployTokenRequest.signer;
      txCreateToken.partialSign(baseMint);
      const serializedTx = txCreateToken
        .serialize({ requireAllSignatures: false })
        .toString("base64");
      return {
        baseMint: baseMint.publicKey.toBase58(),
        transaction: serializedTx,
      };
    }
}