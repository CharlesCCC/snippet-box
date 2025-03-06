import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models';
import { ErrorResponse } from '../utils';

/**
 * Middleware to check if user's email is verified
 * This middleware should be used after the protect middleware that sets req.user
 */
export const isEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user exists and is authenticated
    if (!(req as any).user || !(req as any).user.id) {
      return next(new ErrorResponse(401, 'Not authorized'));
    }

    // Find user
    const user = await UserModel.findByPk((req as any).user.id);
    
    if (!user) {
      return next(new ErrorResponse(404, 'User not found'));
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.warn(`User ${user.id} attempted action with unverified email`);
      return next(new ErrorResponse(403, 'Email not verified. Please verify your email before continuing.'));
    }

    next();
  } catch (error) {
    console.error(`Error checking email verification: ${error}`);
    return next(new ErrorResponse(500, 'Server error'));
  }
}; 