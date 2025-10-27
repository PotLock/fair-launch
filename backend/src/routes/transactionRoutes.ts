import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import TransactionService from '../services/transactionService';
import { CreateTransactionSchema, TransactionQuerySchema, TransactionStatusEnum } from '../types';

const app = new Hono();
const transactionService = new TransactionService();

// Create a transaction
app.post('/', zValidator('json', CreateTransactionSchema), async (c) => {
  try {
    const payload = c.req.valid('json');
    const tx = await transactionService.createTransaction(payload);
    return c.json({ success: true, transaction: tx });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to create transaction' }, 500);
  }
});

// List transactions with optional filters
app.get('/', async (c) => {
  try {
    const filtersRaw = {
      userAddress: c.req.query('userAddress') ?? undefined,
      action: c.req.query('action') ?? undefined,
      baseToken: c.req.query('baseToken') ?? undefined,
      quoteToken: c.req.query('quoteToken') ?? undefined,
      status: c.req.query('status') ?? undefined,
      chain: c.req.query('chain') ?? undefined,
      limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined,
      offset: c.req.query('offset') ? Number(c.req.query('offset')) : undefined,
    };

    const parsed = TransactionQuerySchema.safeParse(filtersRaw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.flatten() }, 400);
    }

    const list = await transactionService.getTransactions(parsed.data);
    return c.json({ success: true, transactions: list });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to get transactions' }, 500);
  }
});

// Get a transaction by ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tx = await transactionService.getTransactionById(id);
    if (!tx) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }
    return c.json({ success: true, transaction: tx });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to get transaction' }, 500);
  }
});

// Get transactions by user address
app.get('/user/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const list = await transactionService.getTransactionsByUserAddress(address);
    return c.json({ success: true, transactions: list });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to get transactions by user' }, 500);
  }
});

// Get transactions where token matches baseToken or quoteToken
app.get('/token/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const list = await transactionService.getTransactionsByTokenAddress(address);
    return c.json({ success: true, transactions: list });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to get transactions by token address' }, 500);
  }
});

// Update transaction status by ID
app.patch('/:id/status', zValidator('json', z.object({ status: TransactionStatusEnum })), async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const updated = await transactionService.updateTransactionStatus(id, status);
    if (!updated) {
      return c.json({ success: false, error: 'Transaction not found' }, 404);
    }
    return c.json({ success: true, transaction: updated });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to update transaction status' }, 500);
  }
});

// Delete transaction by ID
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!id || id.trim() === '') {
      return c.json({ success: false, error: 'Transaction ID is required' }, 400);
    }
    const result = await transactionService.deleteTransaction(id);
    return c.json({ success: true, data: result, message: 'Transaction deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err?.message ?? 'Failed to delete transaction' }, 500);
  }
});

export default app;
