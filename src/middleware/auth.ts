import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncWrapper } from './index';
import { ErrorResponse } from '../utils';
import { UserModel } from '../models';

// Define interface for decoded JWT token
interface DecodedToken {
  id: number;
  iat: number;
  exp: number;
}

// Protect routes
export const protect = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;

    // Check if token exists in headers or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Set token from cookie
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return next(new ErrorResponse(401, 'Not authorized to access this route'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'snippetboxsecret'
      ) as DecodedToken;

      // Find user by id
      const user = await UserModel.findByPk(decoded.id);

      if (!user) {
        return next(new ErrorResponse(404, 'User not found'));
      }

      // Add user to request object
      (req as any).user = user;
      next();
    } catch (err) {
      return next(new ErrorResponse(401, 'Not authorized to access this route'));
    }
  }
); 