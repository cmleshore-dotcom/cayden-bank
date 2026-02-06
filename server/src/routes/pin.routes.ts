import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as pinService from '../services/pin.service';

const router = Router();

const setPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  password: z.string().min(1, 'Password is required'),
});

const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

const removePinSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// Check PIN status
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const has = await pinService.hasPin(req.user!.userId);
      res.json({ status: 'success', data: { hasPin: has } });
    } catch (err) {
      next(err);
    }
  }
);

// Set or update PIN
router.post(
  '/set',
  authenticate,
  validate(setPinSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pinService.setPin(req.user!.userId, req.body.pin, req.body.password);
      res.json({ status: 'success', message: 'PIN set successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// Verify PIN (returns short-lived PIN token for transaction authorization)
router.post(
  '/verify',
  authenticate,
  validate(verifyPinSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pinService.verifyPin(req.user!.userId, req.body.pin);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Remove PIN
router.post(
  '/remove',
  authenticate,
  validate(removePinSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pinService.removePin(req.user!.userId, req.body.password);
      res.json({ status: 'success', message: 'PIN removed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
