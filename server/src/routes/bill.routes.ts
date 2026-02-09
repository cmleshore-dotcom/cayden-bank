import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as billService from '../services/bill.service';

const router = Router();

const createBillSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.enum(['subscription', 'utility', 'rent', 'insurance', 'loan', 'other']),
  amount: z.number().positive(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  dueDay: z.number().int().min(1).max(31),
  autoPay: z.boolean().default(false),
  icon: z.string().optional(),
});

const updateBillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  autoPay: z.boolean().optional(),
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  icon: z.string().optional(),
  category: z.enum(['subscription', 'utility', 'rent', 'insurance', 'loan', 'other']).optional(),
});

// Get all bills
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bills = await billService.getUserBills(req.user!.userId);
      res.json({ status: 'success', data: bills });
    } catch (err) {
      next(err);
    }
  }
);

// Get bill summary
router.get(
  '/summary',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await billService.getBillSummary(req.user!.userId);
      res.json({ status: 'success', data: summary });
    } catch (err) {
      next(err);
    }
  }
);

// Get payment history
router.get(
  '/payments',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const billId = req.query.billId as string | undefined;
      const payments = await billService.getBillPaymentHistory(
        req.user!.userId,
        billId
      );
      res.json({ status: 'success', data: payments });
    } catch (err) {
      next(err);
    }
  }
);

// Create a bill
router.post(
  '/',
  authenticate,
  validate(createBillSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bill = await billService.createBill({
        userId: req.user!.userId,
        accountId: req.body.accountId,
        name: req.body.name,
        category: req.body.category,
        amount: req.body.amount,
        frequency: req.body.frequency,
        dueDay: req.body.dueDay,
        autoPay: req.body.autoPay,
        icon: req.body.icon,
      });
      res.status(201).json({ status: 'success', data: bill });
    } catch (err) {
      next(err);
    }
  }
);

// Update a bill
router.put(
  '/:id',
  authenticate,
  validate(updateBillSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bill = await billService.updateBill(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.json({ status: 'success', data: bill });
    } catch (err) {
      next(err);
    }
  }
);

// Pay a bill
router.post(
  '/:id/pay',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billService.payBill(req.user!.userId, req.params.id);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a bill
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billService.deleteBill(req.user!.userId, req.params.id);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
