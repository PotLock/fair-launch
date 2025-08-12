import { Connection, Keypair, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { 
  ChainKind, 
  getChain, 
  type OmniAddress,
  } from "omni-bridge-sdk";
import BRIDGE_TOKEN_FACTORY_IDL from "../contracts/IDLs/bridge_token_factory.json" with {
  type: "json",
}
import { Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { OmniTransferMessage } from "../types";

// ============= Bridge =============

const MPL_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
export const wormholeProgramId = new PublicKey("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5")
export const lockerAddress = "omni.n-bridge.testnet"


function getConstant(name: string) {
  const value = (BRIDGE_TOKEN_FACTORY_IDL as any).constants.find(
    (c: any) => c.name === name,
  )?.value
  if (!value) throw new Error(`Missing constant: ${name}`)
  // Parse the string array format "[x, y, z]" into actual numbers
  const numbers = JSON.parse(value as string)
  return new Uint8Array(numbers)
}

function wrappedMintId(token: string, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [getConstant("WRAPPED_MINT_SEED"), Buffer.from(token, "utf-8")],
    programId,
  )
}

function authority(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [getConstant("AUTHORITY_SEED")],
    programId,
  )
}

function config(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [getConstant("CONFIG_SEED")],
    programId,
  )
}

function wormholeBridgeId(wormholeProgramId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("Bridge", "utf-8")],
    wormholeProgramId,
  )
}

function wormholeFeeCollectorId(wormholeProgramId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("fee_collector", "utf-8")],
    wormholeProgramId,
  )
}

function wormholeSequenceId(wormholeProgramId: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("Sequence", "utf-8"), config(programId)[0].toBuffer()],
    wormholeProgramId,
  )
}

function vaultId(programId: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [getConstant("VAULT_SEED"), mint.toBuffer()],
    programId,
  )
}


function solVaultId(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [getConstant("SOL_VAULT_SEED")],
    programId,
  )
}

export async function getTokenProgramForMint(mint: PublicKey, connection: Connection): Promise<PublicKey> {
  const accountInfo = await connection.getAccountInfo(mint)
  if (!accountInfo) {
    throw new Error("Failed to find mint account")
  }

  // Check the owner of the mint account
  if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return TOKEN_2022_PROGRAM_ID
  }
  return TOKEN_PROGRAM_ID
}


export async function logMetadata(token: OmniAddress, program: anchor.Program, payer?: Keypair): Promise<string> {
  const tokenPublicKey = new PublicKey(token.split(":")[1])
  console.log(program.provider.connection)
  const tokenProgram = await getTokenProgramForMint(tokenPublicKey, program.provider.connection)
  
  const wormholeMessage = Keypair.generate()

  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf-8"), MPL_PROGRAM_ID.toBuffer(), tokenPublicKey.toBuffer()],
    MPL_PROGRAM_ID,
  )

  console.log("metadata", metadata.toBase58())

  const [vault] = vaultId(program.programId, tokenPublicKey)

  try {
    const tx = await program.methods
      .logMetadata()
      .accountsStrict({
        authority: authority(program.programId)[0],
        mint: tokenPublicKey,
        metadata,
        vault,
        common: {
          payer: payer?.publicKey || program.provider.publicKey!,
          config: config(program.programId)[0],
          bridge: wormholeBridgeId(wormholeProgramId)[0],
          feeCollector: wormholeFeeCollectorId(wormholeProgramId)[0],
          sequence: wormholeSequenceId(wormholeProgramId, program.programId)[0],
          clock: SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          wormholeProgram: wormholeProgramId,
          message: wormholeMessage.publicKey,
        },
        systemProgram: SystemProgram.programId,
        tokenProgram: tokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers(payer instanceof Keypair ? [wormholeMessage, payer] : [wormholeMessage])
      .rpc()

    return tx
  } catch (e) {
    throw new Error(`Failed to log metadata: ${e}`)
  }
}

export async function isBridgedToken(token: PublicKey, program: anchor.Program): Promise<boolean> {
  const mintInfo = await program.provider.connection.getParsedAccountInfo(token)

  console.log('mintInfo', mintInfo)

  if (!mintInfo.value) {
    throw new Error("Failed to find mint account")
  }

  const data = mintInfo.value.data as ParsedAccountData
  if (
    !data.parsed ||
    (data.program !== "spl-token" && data.program !== "spl-token-2022") ||
    data.parsed.type !== "mint"
  ) {
    throw new Error("Not a valid SPL token mint")
  }

  return (
    data.parsed.info.mintAuthority &&
    data.parsed.info.mintAuthority.toString() === authority(program.programId)[0].toString()
  )
}

export async function initTransfer(transfer: OmniTransferMessage, program: anchor.Program ,payer?: Keypair): Promise<string> {
  if (getChain(transfer.tokenAddress) !== ChainKind.Sol) {
    throw new Error("Token address must be on Solana")
  }
  const wormholeMessage = Keypair.generate()

  const payerPubKey = payer?.publicKey || program.provider.publicKey
  if (!payerPubKey) {
    throw new Error("Payer is not configured")
  }

  const programBridge = new Program(
    BRIDGE_TOKEN_FACTORY_IDL as anchor.Idl,
    program.provider as any
  );

  const [solVault] = solVaultId(programBridge.programId)

  // biome-ignore lint/suspicious/noExplicitAny: initTransfer or initTransferSol
  let method: any
  if (transfer.tokenAddress === `sol:${PublicKey.default.toBase58()}`) {
    method = programBridge.methods
      .initTransferSol({
        amount: new BN(transfer.amount.valueOf().toString()),
        recipient: transfer.recipient,
        fee: new BN(transfer.fee.valueOf().toString()),
        nativeFee: new BN(transfer.nativeFee.valueOf().toString()),
        message: transfer.message || "",
      })
      .accountsStrict({
        solVault,
        user: payerPubKey,
        common: {
          payer: payerPubKey,
          config: config(programBridge.programId)[0],
          bridge: wormholeBridgeId(wormholeProgramId)[0],
          feeCollector: wormholeFeeCollectorId(wormholeProgramId)[0],
          sequence: wormholeSequenceId(wormholeProgramId, programBridge.programId)[0],
          clock: SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          wormholeProgram: wormholeProgramId,
          message: wormholeMessage.publicKey,
        },
      })
  } else {
    const mint = new PublicKey(transfer.tokenAddress.split(":")[1])
    const tokenProgram = await getTokenProgramForMint(mint, program.provider.connection)
    const [from] = PublicKey.findProgramAddressSync(
      [payerPubKey.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )
    const vault = (await isBridgedToken(mint, program)) ? null : vaultId(programBridge.programId, mint)[0]

    method = programBridge.methods
      .initTransfer({
        amount: new BN(transfer.amount.valueOf().toString()),
        recipient: transfer.recipient,
        fee: new BN(transfer.fee.valueOf().toString()),
        nativeFee: new BN(transfer.nativeFee.valueOf().toString()),
        message: transfer.message || "",
      })
      .accountsStrict({
        authority: authority(programBridge.programId)[0],
        mint,
        from,
        vault: vault as PublicKey,
        solVault,
        user: payerPubKey,
        common: {
          payer: payerPubKey,
          config: config(programBridge.programId)[0],
          bridge: wormholeBridgeId(wormholeProgramId)[0],
          feeCollector: wormholeFeeCollectorId(wormholeProgramId)[0],
          sequence: wormholeSequenceId(wormholeProgramId, programBridge.programId)[0],
          clock: SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          wormholeProgram: wormholeProgramId,
          message: wormholeMessage.publicKey,
        },
        tokenProgram: tokenProgram,
      })
  }

  try {
    const tx = await method
      .signers(payer instanceof Keypair ? [wormholeMessage, payer] : [wormholeMessage])
      .rpc()

    return tx
  } catch (e) {
    throw new Error(`Failed to init transfer: ${e}`)
  }
}
