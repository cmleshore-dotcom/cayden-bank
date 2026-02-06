import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as linkedAccountService from '../services/linkedAccount.service';

const router = Router();

const linkAccountSchema = z.object({
  bankName: z.string().min(1).max(100),
  accountHolderName: z.string().min(1).max(200),
  accountNumberLast4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
  routingNumber: z.string().regex(/^\d{9}$/, 'Must be exactly 9 digits'),
  accountType: z.enum(['checking', 'savings']).default('checking'),
});

// Get all linked accounts
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await linkedAccountService.getUserLinkedAccounts(
        req.user!.userId
      );
      res.json({ status: 'success', data: accounts });
    } catch (err) {
      next(err);
    }
  }
);

// Link a new bank account
router.post(
  '/',
  authenticate,
  validate(linkAccountSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await linkedAccountService.linkAccount(
        req.user!.userId,
        req.body
      );
      res.status(201).json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

// Get a specific linked account
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await linkedAccountService.getLinkedAccountById(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

// Verify a linked account (simulated)
router.post(
  '/:id/verify',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await linkedAccountService.verifyLinkedAccount(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

// Set as primary account
router.post(
  '/:id/primary',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await linkedAccountService.setPrimaryAccount(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: account });
    } catch (err) {
      next(err);
    }
  }
);

// Unlink a bank account
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await linkedAccountService.unlinkAccount(
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
