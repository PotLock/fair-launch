import { DEVNET_PROGRAM_ID, CpmmPoolInfoLayout } from '@raydium-io/raydium-sdk-v2';
import { PublicKey } from '@solana/web3.js';
import { connection } from '../configs/raydium';

export async function getAllCpmmPools() {
  const cpmmPools: (ReturnType<typeof CpmmPoolInfoLayout.decode> & { poolId: PublicKey })[] = []

  const cpmmPoolsData = await connection.getProgramAccounts(
    DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
  )

  for (const acc of cpmmPoolsData) {
    try {
      const decoded = CpmmPoolInfoLayout.decode(acc.account.data)
      cpmmPools.push({ ...decoded, poolId: acc.pubkey })
    } catch (e) {
      // skip if decode fail
    }
  }

  return cpmmPools
}

export async function getUserCreatedCpmmPools(user: PublicKey) {
  const allPools = await getAllCpmmPools()
  const userPools = allPools.filter((pool) => pool.poolCreator.equals(user))

  return userPools
}
