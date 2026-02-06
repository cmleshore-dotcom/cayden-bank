import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requirePinToken } from '../middleware/pinVerify';
import * as advanceService from '../services/advance.service';
import { hasVerifiedLinkedAccount } from '../services/linkedAccount.service';
import { hasPin } from '../services/pin.service';

const router = Router();

const requestAdvanceSchema = z.object({
  amount: z.number().min(25).max(500),
  deliverySpeed: z.enum(['standard', 'express']).default('standard'),
  tip: z.number().min(0).default(0),
});

router.get(
  '/eligibility',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [result, hasLinkedBank] = await Promise.all([
        advanceService.checkEligibility(req.user!.userId),
        hasVerifiedLinkedAccount(req.user!.userId),
      ]);
      res.json({ status: 'success', data: { ...result, hasLinkedBank } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticate,
  validate(requestAdvanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Require PIN verification for advances > $100 if user has PIN set
      if (req.body.amount > 100) {
        const userHasPin = await hasPin(req.user!.userId);
        if (userHasPin) {
          try {
            requirePinToken(req, res, () => {});
          } catch {
            return res.status(403).json({
              status: 'error',
              message: 'PIN verification required for advances over $100',
              requirePin: true,
            });
          }
        }
      }

      const result = await advanceService.requestAdvance(
        req.user!.userId,
        req.body.amount,
        req.body.deliverySpeed,
        req.body.tip
      );
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const advances = await advanceService.getUserAdvances(req.user!.userId);
      res.json({ status: 'success', data: advances });
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
      const advance = await advanceService.getAdvanceById(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: advance });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/repay',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await advanceService.repayAdvance(
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
