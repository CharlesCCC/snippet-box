import { Request, Response, NextFunction } from 'express';
import { asyncWrapper } from '../middleware';
import { UserModel } from '../models';
import { ErrorResponse, Logger } from '../utils';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';

const logger = new Logger('auth');

// Generate JWT token
const generateToken = (id: number): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET || 'snippetboxsecret';
  return jwt.sign(
    { id },
    secret,
    { expiresIn: process.env.JWT_EXPIRE || '30d' } as jwt.SignOptions
  );
};

// Send token response with cookie
const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response
): void => {
  // Create token
  const token = generateToken(user.id);

  const options = {
    expires: new Date(
      Date.now() + 
      Number(process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        id: user.id,
        email: user.email,
        user_name: user.user_name
      }
    });
};

/**
 * @description Register a user
 * @route /api/auth/register
 * @request POST
 */
export const register = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ErrorResponse(400, 'Please provide email and password'));
    }

    // Check if user already exists
    const userExists = await UserModel.findOne({ where: { email } });
    if (userExists) {
      return next(new ErrorResponse(400, 'Email already in use'));
    }

    // Create user
    const user = await UserModel.create({
      email,
      password,
      user_name: `user_${Math.random().toString(36).substring(2, 10)}` // Generate random username
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  }
);

/**
 * @description Login user
 * @route /api/auth/login
 * @request POST
 */
export const login = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ErrorResponse(400, 'Please provide email and password'));
    }

    // Find user
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      return next(new ErrorResponse(401, 'Invalid credentials'));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse(401, 'Invalid credentials'));
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  }
);

/**
 * @description Logout user / clear cookie
 * @route /api/auth/logout
 * @request GET
 */
export const logout = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  }
);

/**
 * @description Get current logged in user
 * @route /api/auth/me
 * @request GET
 */
export const getMe = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // User is already available in req due to the protect middleware
    const user = await UserModel.findByPk((req as any).user.id, {
      attributes: ['id', 'email', 'user_name', 'createdAt', 'updatedAt']
    });

    res.status(200).json({
      success: true,
      data: user
    });
  }
);

/**
 * @description Update user details
 * @route /api/auth/updatedetails
 * @request PUT
 */
export const updateDetails = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, user_name } = req.body;

    // Update user details
    const user = await UserModel.findByPk((req as any).user.id);
    
    if (!user) {
      return next(new ErrorResponse(404, 'User not found'));
    }

    // Check if username is already taken
    if (user_name && user_name !== user.user_name) {
      const existingUser = await UserModel.findOne({ where: { user_name } });
      if (existingUser) {
        return next(new ErrorResponse(400, 'Username is already taken'));
      }
    }

    // Update fields
    user.email = email;
    if (user_name) {
      user.user_name = user_name;
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        user_name: user.user_name
      }
    });
  }
);

/**
 * @description Update password
 * @route /api/auth/updatepassword
 * @request PUT
 */
export const updatePassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await UserModel.findByPk((req as any).user.id);
    
    if (!user) {
      return next(new ErrorResponse(404, 'User not found'));
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse(401, 'Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  }
);

/**
 * @description Forgot password
 * @route /api/auth/forgotpassword
 * @request POST
 */
export const forgotPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    // Find user
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      return next(new ErrorResponse(404, 'There is no user with that email'));
    }

    // Generate and set reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash the token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration - 10 minutes
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // In a real application, you would send an email with the reset token
    // For now, we'll just return the token in the response
    logger.log(`Reset token: ${resetToken}`, 'INFO');

    res.status(200).json({
      success: true,
      data: {
        resetToken // In production, you'd remove this
      }
    });
  }
);

/**
 * @description Reset password
 * @route /api/auth/resetpassword/:resettoken
 * @request PUT
 */
export const resetPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Find user with token and check if token is still valid
    const user = await UserModel.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      return next(new ErrorResponse(400, 'Invalid token'));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  }
); 