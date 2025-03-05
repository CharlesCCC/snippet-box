import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncWrapper } from './index';
import { ErrorResponse } from '../utils';
import { UserModel, SnippetModel } from '../models';

// Define interface for decoded JWT token
interface DecodedToken {
  id: string; // UUID stored as string
  iat: number;
  exp: number;
}

// Protect routes
export const protect = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;

    // Debug logging
    console.log('Auth middleware - Request path:', req.path);
    console.log('Auth middleware - Request method:', req.method);
    
    // Check both authorization header AND cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc: {[key: string]: string}, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    token = cookies?.token || req.headers.authorization?.split(' ')[1];

    console.log('Token:', token ? 'Present' : 'Not present');

    // If no token is present
    if (!token) {
      // Allow public access to root path
      if (req.path === '/') {
        console.log('Auth middleware - Allowing access to root path');
        return next();
      }
      
      // Check if this is a request for a specific snippet
      const snippetIdMatch = req.path.match(/^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (snippetIdMatch && req.method === 'GET') {
        const snippetId = snippetIdMatch[1];
        console.log('Auth middleware - Checking if snippet is public:', snippetId);
        // Check if the snippet is public
        const snippet = await SnippetModel.findByPk(snippetId);
        if (snippet && snippet.get('is_public')) {
          console.log('Auth middleware - Allowing access to public snippet');
          // Allow access to public snippets without authentication
          return next();
        }
      }
      
      // For API requests, return a JSON error instead of redirecting
      if (req.originalUrl.startsWith('/api/')) {
        console.log('Auth middleware - API request without token, returning 401');
        return next(new ErrorResponse(401, 'Authentication required to access this resource'));
      }
      
      console.log('Auth middleware - Redirecting to login');
      // Redirect to login for other paths
      return res.redirect('/login');
    } 
    
    // If token is present, verify it
    try {
      console.log('Auth middleware - Verifying token');
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'snippetboxsecret'
      ) as DecodedToken;

      console.log('Auth middleware - Token decoded, user ID:', decoded.id);
      const user = await UserModel.findByPk(decoded.id);
      
      if (!user) {
        console.log('Auth middleware - User not found');
        return next(new ErrorResponse(404, 'User belonging to this token does not exist'));
      }

      console.log('Auth middleware - User authenticated:', user.get('id'));
      // Add proper typing for user
      (req as any).user = user.get({ plain: true });
      return next();
    } catch (err) {
      console.log('Auth middleware - Token verification failed:', err);
      
      // For API requests, return a JSON error
      if (req.originalUrl.startsWith('/api/')) {
        return next(new ErrorResponse(401, 'Invalid or expired authentication token'));
      }
      
      // For web requests, redirect to login
      return res.redirect('/login');
    }
  }
);

/**
 * Optional protection middleware - Verifies JWT if present, but doesn't require authentication
 * Allows accessing public resources while still identifying the user if logged in
 */
export const optionalProtect = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;
    
    console.log('Optional Auth middleware - Request path:', req.path);
    
    // Check both authorization header AND cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc: {[key: string]: string}, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    token = cookies?.token || req.headers.authorization?.split(' ')[1];

    console.log('Token:', token ? 'Present' : 'Not present');

    // If token exists, verify it and attach user to request
    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'snippetboxsecret'
        ) as DecodedToken;

        // Get user from database
        const user = await UserModel.findByPk(decoded.id);

        if (user) {
          // Attach user to request object
          (req as any).user = user;
          console.log('Optional Auth middleware - User attached to request');
        }
      } catch (error) {
        console.log('Optional Auth middleware - Invalid token, continuing as unauthenticated');
        // Don't return error, just continue as unauthenticated
      }
    }

    // Always proceed to the next middleware
    next();
  }
); 