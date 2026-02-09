import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as notificationService from '../services/notification.service';

const router = Router();

// Get all notifications for user
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // Generate any new activity-based notifications
      try {
        await notificationService.generateActivityNotifications(req.user!.userId);
      } catch {
        // Non-critical
      }

      const result = await notificationService.getUserNotifications(
        req.user!.userId,
        limit,
        offset
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Get unread count
router.get(
  '/unread-count',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.getUnreadCount(req.user!.userId);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Mark a single notification as read
router.post(
  '/:id/read',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.markAsRead(
        req.user!.userId,
        req.params.id
      );
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Mark all notifications as read
router.post(
  '/read-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.markAllAsRead(req.user!.userId);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a notification
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.deleteNotification(
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
