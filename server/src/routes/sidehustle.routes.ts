import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import db from '../config/database';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let query = db('side_hustles').where({ is_active: true });

      if (req.query.category) {
        query = query.where({ category: req.query.category });
      }

      const hustles = await query.orderBy('created_at', 'desc');

      res.json({
        status: 'success',
        data: hustles.map((h) => ({
          id: h.id,
          title: h.title,
          company: h.company,
          description: h.description,
          category: h.category,
          payRange: h.pay_range,
          location: h.location,
          url: h.url,
          createdAt: h.created_at,
        })),
      });
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
      const hustle = await db('side_hustles')
        .where({ id: req.params.id, is_active: true })
        .first();

      if (!hustle) {
        throw new NotFoundError('Side hustle not found');
      }

      res.json({
        status: 'success',
        data: {
          id: hustle.id,
          title: hustle.title,
          company: hustle.company,
          description: hustle.description,
          category: hustle.category,
          payRange: hustle.pay_range,
          location: hustle.location,
          url: hustle.url,
          createdAt: hustle.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
