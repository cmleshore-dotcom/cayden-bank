import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as goalService from '../services/goal.service';

const router = Router();

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  targetDate: z.string().optional(),
  autoFundAmount: z.number().min(0).optional(),
  autoFundEnabled: z.boolean().optional(),
  icon: z.string().optional(),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().optional(),
  autoFundAmount: z.number().min(0).optional(),
  autoFundEnabled: z.boolean().optional(),
  icon: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
});

const fundGoalSchema = z.object({
  amount: z.number().positive(),
});

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goals = await goalService.getUserGoals(req.user!.userId);
      res.json({ status: 'success', data: goals });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authenticate,
  validate(createGoalSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goal = await goalService.createGoal(req.user!.userId, req.body);
      res.status(201).json({ status: 'success', data: goal });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  validate(updateGoalSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goal = await goalService.updateGoal(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.json({ status: 'success', data: goal });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await goalService.deleteGoal(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/fund',
  authenticate,
  validate(fundGoalSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await goalService.fundGoal(
        req.user!.userId,
        req.params.id,
        req.body.amount
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
