import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as accountService from '../services/account.service';

const router = Router();

const depositSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
});

const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await accountService.getUserAccounts(req.user!.userId);
      res.json({ status: 'success', data: accounts });
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
      const account = await accountService.getAccountById(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.createSavingsAccount(req.user!.userId);
      res.status(201).json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/deposit',
  authenticate,
  validate(depositSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.deposit(
        req.user!.userId,
        req.params.id,
        req.body.amount,
        req.body.description
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/transfer',
  authenticate,
  validate(transferSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.transfer(
        req.user!.userId,
        req.body.fromAccountId,
        req.body.toAccountId,
        req.body.amount,
        req.body.description
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/toggle-roundup',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.toggleRoundUp(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
