import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

/**
 * Middleware that verifies a short-lived PIN token (issued by POST /api/pin/verify).
 * Attach to routes that require PIN authorization for sensitive operations.
 */
export function requirePinToken(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const pinToken = req.headers['x-pin-token'] as string | undefined;

  if (!pinToken) {
    throw new UnauthorizedError('PIN verification required for this action');
  }

  try {
    const decoded = jwt.verify(pinToken, JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'pin-verify') {
      throw new UnauthorizedError('Invalid PIN token');
    }

    // Ensure the PIN token belongs to the same user
    if (decoded.userId !== req.user?.userId) {
      throw new UnauthorizedError('PIN token does not match authenticated user');
    }

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('PIN token expired or invalid. Please re-verify your PIN.');
  }
}
