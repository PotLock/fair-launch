import { ApiClient, type DbcConfig, LaunchClient} from "@cookedbusiness/halfbaked-sdk";
import { Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { getRpcSOLEndpoint } from "../lib/sol";
import type { DbcConfigRequest, DeployTokenRequest, SwapTokenRequest } from "../types";
import { getDBCConfig } from "../configs/dbc.config";
import { NATIVE_MINT } from "@solana/spl-token";
import { toSdkMetadata } from "../lib/halfbak";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import Decimal from 'decimal.js'

export class HalfbakService {
    private launchClient: LaunchClient;
    private connection: Connection;
    private apiClient: ApiClient;

    constructor() {
        this.connection = new Connection(getRpcSOLEndpoint());
        this.launchClient = new LaunchClient(this.connection);
        this.apiClient = new ApiClient()
    }

    async createDbcConfig(dbcConfigRequest: DbcConfigRequest) {
      const metadata = toSdkMetadata(dbcConfigRequest.metadata);

      const dbcConfig: DbcConfig = getDBCConfig(
        dbcConfigRequest.signer,
        dbcConfigRequest.metadata.name,
        dbcConfigRequest.metadata.symbol,
        metadata
      );
    
      const quoteMint = new PublicKey(NATIVE_MINT.toString());
      const dbcConfigKeypair = Keypair.generate();
    
      const dbcConfigTransaction = await this.launchClient.createDbcConfig(
        dbcConfig,
        dbcConfigRequest.signer,
        dbcConfigKeypair,
        quoteMint
      );
    
      const latestBlockhash = await this.connection.getLatestBlockhash();

      if (dbcConfigTransaction instanceof VersionedTransaction) {
        const message = TransactionMessage.decompile(dbcConfigTransaction.message);
        message.recentBlockhash = latestBlockhash.blockhash;
      
        const newTx = new VersionedTransaction(message.compileToV0Message());
        return {
          dbcConfigKeypair,
          dbcConfigTransaction: Buffer.from(newTx.serialize()).toString("base64"),
        };
      } else {
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

    async swap(swapRequest: SwapTokenRequest){
      const swapConfig = {
        baseMint: swapRequest.baseMint,
        amountIn: swapRequest.amount,
        slippageBps: swapRequest.slippageBps,
        swapBaseForQuote: swapRequest.swapBaseForQuote, // if true, swap base for quote | if false, swap quote for base
        referralTokenAccount: swapRequest.referralTokenAccount,
      }
      const txSwap = await this.launchClient.swap(swapConfig,swapRequest.computeUnitPriceMicroLamports ,swapRequest.signer, swapRequest.baseMint);
      
      const latestBlockhash = await this.connection.getLatestBlockhash();
      txSwap.recentBlockhash = latestBlockhash.blockhash;
      txSwap.feePayer = swapRequest.signer;
      const serializedTx = txSwap
        .serialize({ requireAllSignatures: false })
        .toString("base64");
      return {
        baseMint: swapRequest.baseMint.toBase58(),
        transaction: serializedTx,
      };
    }

    async whiteListToken(tokenAddress: string){
      const result = await this.apiClient.whitelistCookedpadToken(tokenAddress);
      if(!result){
        return {
          success: false,
          message: 'Failed to whitelist token',
        }
      }
      return result
    }

    async unWhitelistToken(tokenAddress: string){
      const result = await this.apiClient.unwhitelistCookedpadToken(tokenAddress);
      if(!result){
        return {
          success: false,
          message: 'Failed to unwhitelist token',
        }
      }
      return result
    }

    async getPoolStateByMintAddress(mintAddress: string){
      try {
        const connection = new Connection(getRpcSOLEndpoint());
        const dbcInstance = new DynamicBondingCurveClient(connection, 'confirmed');

        const poolState = await dbcInstance.state.getPoolByBaseMint(mintAddress);
        if (!poolState) {
          throw new Error(`DBC Pool not found for ${mintAddress}`);
        }

        return poolState;
      } catch (error) {
        console.error('Error getting pool by mint address:', error);
        throw new Error('Failed to get pool by mint address');
      }
    }

    async getPoolConfigByMintAddress(mintAddress: string){
      try {
        const connection = new Connection(getRpcSOLEndpoint());
        const dbcInstance = new DynamicBondingCurveClient(connection, 'confirmed');

        const poolState = await dbcInstance.state.getPoolByBaseMint(mintAddress);
        if (!poolState) {
          throw new Error(`DBC Pool not found for ${mintAddress.toString()}`);
        }
      
        const dbcConfigAddress = poolState.account.config;
        const poolConfig = await dbcInstance.state.getPoolConfig(dbcConfigAddress);
        if (!poolConfig) {
          throw new Error(`DBC Pool config not found for ${dbcConfigAddress.toString()}`);
        }
        return poolConfig;
      } catch (error) {
        console.error('Error getting pool config by mint address:', error);
        throw new Error('Failed to get pool config by mint address');
      }
    }

    async getPoolMetadataByMintAddress(mintAddress: string){
      try {
        const connection = new Connection(getRpcSOLEndpoint());
        const dbcInstance = new DynamicBondingCurveClient(connection, 'confirmed');

        const poolState = await dbcInstance.state.getPoolByBaseMint(mintAddress);
        if (!poolState) {
          throw new Error(`DBC Pool not found for ${mintAddress.toString()}`);
        }
      
        const dbcConfigAddress = poolState.account.config;
        const poolMetadata = await dbcInstance.state.getPoolMetadata(dbcConfigAddress);
        if (!poolMetadata) {
          throw new Error(`DBC Pool metadata not found for ${dbcConfigAddress.toString()}`);
        }
        return poolMetadata;
      } catch (error) {
        console.error('Error getting pool metadata:', error);
        throw new Error('Failed to get pool metadata');
      }
    }

    async getPoolCurveProgressByMintAddress(mintAddress: string){
      try {
        const connection = new Connection(getRpcSOLEndpoint());
        const dbcInstance = new DynamicBondingCurveClient(connection, 'confirmed');

        const poolState = await dbcInstance.state.getPoolByBaseMint(mintAddress);
        if (!poolState) {
          throw new Error(`DBC Pool not found for ${mintAddress.toString()}`);
        }
      
        const dbcConfigAddress = poolState.account.config;
        const poolConfig = await dbcInstance.state.getPoolConfig(dbcConfigAddress);
        if (!poolConfig) {
          throw new Error(`DBC Pool curve progress not found for ${dbcConfigAddress.toString()}`);
        }
        const quoteReserve = poolState.account.quoteReserve
        const migrationThreshold = poolConfig.migrationQuoteThreshold

        const quoteReserveDecimal = new Decimal(quoteReserve.toString())
        const thresholdDecimal = new Decimal(migrationThreshold.toString())

        const progress = quoteReserveDecimal.div(thresholdDecimal).toNumber()
        return progress
      } catch (error) {
        console.error('Error getting pool curve progress by mint address:', error);
        throw new Error('Failed to get pool curve progress by mint address');
      }
    }
}