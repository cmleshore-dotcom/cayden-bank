import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as chatService from '../services/chat.service';

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(1000),
});

router.post(
  '/',
  authenticate,
  validate(messageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await chatService.processMessage(
        req.user!.userId,
        req.body.message
      );
      res.json({ status: 'success', data: response });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const history = await chatService.getChatHistory(req.user!.userId, limit);
      res.json({ status: 'success', data: history });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
