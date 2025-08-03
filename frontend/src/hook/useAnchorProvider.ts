import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idlBondingCurve from "../contracts/IDLs/bonding_curve.json";
import { Keypair, Transaction, Connection } from "@solana/web3.js";
import BRIDGE_TOKEN_FACTORY_IDL from "../contracts/IDLs/bridge_token_factory.json" with {
  type: "json",
}

// Custom provider that implements sendAndConfirm method
class CustomAnchorProvider extends anchor.AnchorProvider {
  async sendAndConfirm(transaction: Transaction, signers?: Keypair[], opts?: any): Promise<string> {
    // Use the parent's sendAndConfirm method
    return super.sendAndConfirm(transaction, signers, opts);
  }
}

export default function useAnchorProvider() {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  // Return null if wallet or connection is not available
  if (!connection || !anchorWallet) {
    return null;
  }

  const providerProgram = new CustomAnchorProvider(
    connection,
    anchorWallet as any,
    {
      preflightCommitment: "confirmed",
    }
  );
  
  const program = new Program(
    idlBondingCurve as anchor.Idl,
    providerProgram as any
  );

  const programBridgeTokenFactory = new Program(
    BRIDGE_TOKEN_FACTORY_IDL as anchor.Idl,
    providerProgram as any
  );

  const governanceKeypair = Keypair.generate();
  const mintKeypair = Keypair.generate();
  
  return {
    connection,
    anchorWallet,
    providerProgram,
    program,
    governanceKeypair,
    mintKeypair,
    programBridgeTokenFactory
  };
}