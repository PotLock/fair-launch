import { db } from '../../db/connection';
import { transactions } from '../../db/schema';
import { and, eq, or } from 'drizzle-orm';
import type { CreateTransactionRequest, TransactionQueryRequest, TransactionEntity } from '../types';
import { TransactionStatus, TransactionChain } from '../types';

export class TransactionService {
  async createTransaction(data: CreateTransactionRequest): Promise<TransactionEntity> {
    const [inserted] = await db.insert(transactions).values({
      userAddress: data.userAddress,
      txHash: data.txHash,
      action: data.action,
      baseToken: data.baseToken,
      quoteToken: data.quoteToken,
      amountIn: data.amountIn.toString(),
      amountOut: data.amountOut.toString(),
      pricePerToken: data.pricePerToken ? data.pricePerToken.toString() : null,
      slippageBps: (data.slippageBps ?? 50).toString(),
      fee: (data.fee ?? 0).toString(),
      feeToken: data.feeToken ?? 'SOL',
      status: data.status ?? TransactionStatus.PENDING,
      chain: data.chain ?? TransactionChain.SOLANA,
      poolAddress: data.poolAddress,
    }).returning();

    return inserted as unknown as TransactionEntity;
  }

  async getTransactions(filters?: TransactionQueryRequest): Promise<TransactionEntity[]> {
    const conditions: any[] = [];
    if (filters?.userAddress) conditions.push(eq(transactions.userAddress, filters.userAddress));
    if (filters?.action) conditions.push(eq(transactions.action, filters.action));
    if (filters?.baseToken) conditions.push(eq(transactions.baseToken, filters.baseToken));
    if (filters?.quoteToken) conditions.push(eq(transactions.quoteToken, filters.quoteToken));
    if (filters?.status) conditions.push(eq(transactions.status, filters.status));
    if (filters?.chain) conditions.push(eq(transactions.chain, filters.chain));

    const whereCondition = conditions.length ? and(...conditions) : undefined;

    const rows = await db.query.transactions.findMany({
      where: whereCondition,
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
    return rows as unknown as TransactionEntity[];
  }

  async getTransactionById(id: string): Promise<TransactionEntity | null> {
    const row = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });
    return (row as unknown as TransactionEntity) ?? null;
  }

  async getTransactionsByUserAddress(userAddress: string): Promise<TransactionEntity[]> {
    const rows = await db.query.transactions.findMany({
      where: eq(transactions.userAddress, userAddress),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
    return rows as unknown as TransactionEntity[];
  }

  async getTransactionsByTokenAddress(tokenAddress: string): Promise<TransactionEntity[]> {
    const rows = await db.query.transactions.findMany({
      where: and(
        or(eq(transactions.baseToken, tokenAddress), eq(transactions.quoteToken, tokenAddress)),
        eq(transactions.status, TransactionStatus.SUCCESS)
      ),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
    return rows as unknown as TransactionEntity[];
  }

  async updateTransactionStatus(id: string, txHash: string ,status: 'pending' | 'success' | 'failed'): Promise<TransactionEntity | null> {
    const [updated] = await db
      .update(transactions)
      .set({ txHash, status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();

    return (updated as unknown as TransactionEntity) ?? null;
  }

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
    await db.delete(transactions).where(eq(transactions.id, id));
    return { success: true };
  }
}

export default TransactionService;
