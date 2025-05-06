import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { deserializeBondingCurve, deserializeCurveConfiguration, getKeypairFromFile, getPDAs } from "./utils";
import os from "os";

const programId = new PublicKey("8osGVKUMbLoejHL5nPMjBVppjHNfe7rRsD7L7jNYJN9n");


const connection = new Connection("https://api.devnet.solana.com", {
  commitment: "confirmed",
});


const wallet = getKeypairFromFile(`${os.homedir()}/.config/solana/id.json`);


async function getCurveConfig() {
  const {curveConfig} = await getPDAs(wallet.publicKey, mint, programId);
  const accountInfo = await connection.getAccountInfo(curveConfig);
  if (!accountInfo) {
    console.log("PDA account does not exist or has no data.");
    return;
  }
  const decodedData = deserializeCurveConfiguration(accountInfo.data);
  console.log("Decoded Curve Configuration Data:", decodedData);
}
  
async function getBondingCurveAccounts(mint: PublicKey) {


  const seeds = [Buffer.from("bonding_curve"), mint.toBuffer()];


  const [bondingCurve, bump] = PublicKey.findProgramAddressSync(seeds, programId);

  console.log("PDA Address:", bondingCurve.toBase58());

  const accountInfo = await connection.getAccountInfo(bondingCurve);

  if (!accountInfo) {
    console.log("PDA account does not exist or has no data.");
    return;
  }

  const decodedData = deserializeBondingCurve(accountInfo.data);
  console.log("Decoded BondingCurve Data:", decodedData);

}

const mint = new PublicKey("9nNrWDKsbQZoHHU7bHkfNPC3iicvMFGasyWpEfEnXxAj");



async function main() {
  await getCurveConfig();
  await getBondingCurveAccounts(mint);

}

main();








