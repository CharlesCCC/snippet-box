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

    // Debug logging
    // console.log('Headers:', req.headers.cookie);
    // Check both authorization header AND cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc: {[key: string]: string}, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    token = cookies?.token || req.headers.authorization?.split(' ')[1];

    console.log('Token:', token);
    if (!token) {
      console.log('No token found in cookies or headers');
      return next(new ErrorResponse(401, 'No authentication token found'));
    }

    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'snippetboxsecret'
      ) as DecodedToken;

      const user = await UserModel.findByPk(decoded.id);
      
      if (!user) {
        return next(new ErrorResponse(404, 'User belonging to this token does not exist'));
      }

      // Add proper typing for user
      (req as any).user = user.get({ plain: true });
      next();
    } catch (err) {
      return next(new ErrorResponse(401, 'Invalid or expired authentication token'));
    }
  }
); 