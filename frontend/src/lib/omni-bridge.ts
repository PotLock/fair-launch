import { ChainKind, omniAddress, getBridgedToken, setNetwork } from "omni-bridge-sdk"
import { SOL_NETWORK } from "../configs/env.config";

/**
 * Retrieves the bridged token addresses across different chains for a given Solana token
 * @param {string} mint - The Solana token mint address
 * @returns {Promise<string[] | null>} Returns an array of bridged token addresses on NEAR and Ethereum chains, or null if an error occurs
 * @description This function converts a Solana token address to its corresponding addresses on NEAR and Ethereum chains
 * using the omni-bridge SDK. It returns an array containing the bridged addresses if they exist.
 */
export const getBridgedAddressToken = async (mint: string) => {
    try{
        setNetwork(SOL_NETWORK == "devnet" ? "testnet" : "mainnet")
        const address: string[] = []
        const solOmniAddress = omniAddress(ChainKind.Sol, mint)
        const nearOmniAddress = await getBridgedToken(solOmniAddress, ChainKind.Near)
        if(nearOmniAddress){
            address.push(nearOmniAddress)
        }
        const ethOmniAddress = await getBridgedToken(solOmniAddress, ChainKind.Eth)
        if(ethOmniAddress){
            address.push(ethOmniAddress)
        }
        return address
    }catch(error){
        console.log("error get bridged token", error)
        return null
    }
}
