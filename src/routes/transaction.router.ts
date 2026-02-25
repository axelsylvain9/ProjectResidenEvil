// routes/transaction.routes.ts
import { Router } from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const transacRouter = Router();

// Toutes les routes transactions sont protégées


transacRouter.get('/account/:accountId', authMiddleware, getAllTransactions);
transacRouter.get('/transaction/:id', authMiddleware, getTransactionById);
transacRouter.post('/transaction', authMiddleware, createTransaction);
transacRouter.put('/transaction/:id',authMiddleware, updateTransaction);

export default transacRouter;