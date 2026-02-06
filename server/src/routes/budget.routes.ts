import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as budgetService from '../services/budget.service';

const router = Router();

router.get(
  '/spending',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await budgetService.getSpendingBreakdown(
        req.user!.userId,
        req.query.month as string
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/income-expense',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = req.query.months
        ? parseInt(req.query.months as string, 10)
        : 3;
      const result = await budgetService.getIncomeVsExpense(
        req.user!.userId,
        months
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/prediction',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await budgetService.getPrediction(req.user!.userId);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/trends',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = req.query.months
        ? parseInt(req.query.months as string, 10)
        : 6;
      const result = await budgetService.getTrends(req.user!.userId, months);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
