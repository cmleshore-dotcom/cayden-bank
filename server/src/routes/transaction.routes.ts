import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as transactionService from '../services/transaction.service';

const router = Router();

const simulateSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  merchantName: z.string().min(1),
  spendingCategory: z.enum([
    'food',
    'transport',
    'entertainment',
    'shopping',
    'bills',
    'health',
    'education',
    'other',
  ]),
  description: z.string().optional(),
});

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transactionService.getTransactions(req.user!.userId, {
        accountId: req.query.accountId as string,
        category: req.query.category as string,
        spendingCategory: req.query.spendingCategory as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
      });
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/summary',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await transactionService.getSpendingSummary(
        req.user!.userId,
        req.query.month as string
      );
      res.json({ status: 'success', data: summary });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.getTransactionById(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: transaction });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/simulate',
  authenticate,
  validate(simulateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transactionService.simulatePurchase(
        req.user!.userId,
        req.body.accountId,
        req.body.amount,
        req.body.merchantName,
        req.body.spendingCategory,
        req.body.description
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
