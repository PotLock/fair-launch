import { ChainKind, omniAddress, getBridgedToken, setNetwork, OmniAddress, NetworkType } from "omni-bridge-sdk"
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

/**
 * Retrieves all bridged token addresses across multiple blockchain networks for a given token address
 * @param {string} address - The source token address to find bridged versions for
 * @param {NetworkType} network - The network configuration to use (e.g., "mainnet", "testnet")
 * @returns {Promise<OmniAddress[]>} Returns an array of bridged token addresses across different chains
 * @description This function takes a token address and network configuration, then attempts to find
 * bridged versions of that token across Solana, NEAR, and Ethereum chains. It uses the omni-bridge SDK
 * to convert the source address to omni-addresses and then retrieves the corresponding bridged tokens
 * on each supported chain. The function will return an array containing all successfully found bridged
 * token addresses.
 * 
 * @example
 * ```typescript
 * // Get all bridged tokens for a Solana token on mainnet
 * const bridgedTokens = await getAllBridgeTokens(
 *   "So11111111111111111111111111111111111111112", // SOL token mint
 *   "mainnet"
 * );
 * 
 * // bridgedTokens will contain OmniAddress objects for each chain where the token exists
 * ```
 * 
 * @throws {Error} Throws an error if the bridge token retrieval fails for any reason
 * @see {@link getBridgedAddressToken} - Alternative function for getting bridged addresses from Solana
 */
export const getAllBridgeTokens = async (
    address: string,
    chainToken: ChainKind,
    network: NetworkType
) =>{
    try{
        setNetwork(network)
        const bridgeTokens: OmniAddress[] = []
        const tokenChains = [ChainKind.Sol,ChainKind.Near, ChainKind.Eth]
        for(const tokenChain of tokenChains){
            const tokenAddress = omniAddress(chainToken, address);
            const bridgeToken = await getBridgedToken(tokenAddress,tokenChain)
            if(bridgeToken){
                bridgeTokens.push(bridgeToken)
            }
        }
        // console.log("bridgeTokens", bridgeTokens)
        return bridgeTokens
    }catch(error){
        // console.log("error get fee transfer getBridgedToken", error)
        throw error
    }
}
