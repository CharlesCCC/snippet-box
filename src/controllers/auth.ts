import { Request, Response, NextFunction } from 'express';
import { asyncWrapper } from '../middleware';
import { UserModel, SnippetModel, TagModel } from '../models';
import { ErrorResponse, Logger, EmailService } from '../utils';
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
        user_name: user.user_name,
        isEmailVerified: user.isEmailVerified
      }
    });
};

// Helper to generate email verification token
const generateEmailVerificationToken = async (user: any): Promise<string> => {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Set token and expiration
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set token expiration (24 hours)
  user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await user.save();

  return verificationToken;
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
      user_name: `PromptUp_${Math.random().toString(36).substring(2, 10)}` // Generate random username
    });

    // Generate verification token
    const verificationToken = await generateEmailVerificationToken(user);

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.user_name
      );

      res.status(201).json({
        success: true,
        message: 'User registered. Please check your email to verify your account.',
        data: {
          id: user.id,
          email: user.email,
          user_name: user.user_name,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      // If email sending fails, still create user but warn them
      console.error(`Failed to send verification email: ${error}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered but failed to send verification email. Please try to resend verification email.',
        data: {
          id: user.id,
          email: user.email,
          user_name: user.user_name,
          isEmailVerified: user.isEmailVerified
        }
      });
    }
  }
);

/**
 * @description Verify email
 * @route /api/auth/verify-email/:token
 * @request GET
 */
export const verifyEmail = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with token and not expired
    const user = await UserModel.findOne({
      where: {
        emailVerificationToken,
        emailVerificationExpire: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return next(new ErrorResponse(400, 'Invalid or expired token'));
    }

    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res);
  }
);

/**
 * @description Resend verification email
 * @route /api/auth/resend-verification
 * @request POST
 */
export const resendVerificationEmail = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse(400, 'Please provide email'));
    }

    // Find user
    const user = await UserModel.findOne({ where: { email } });
    
    if (!user) {
      return next(new ErrorResponse(404, 'User not found'));
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return next(new ErrorResponse(400, 'Email already verified'));
    }

    // Generate verification token
    const verificationToken = await generateEmailVerificationToken(user);

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.user_name
      );

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      console.error(`Failed to resend verification email: ${error}`);
      return next(new ErrorResponse(500, 'Failed to send verification email'));
    }
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

/**
 * @description Get a user's public profile by username
 * @route /api/auth/profile/:username
 * @request GET
 */
export const getUserProfile = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const username = req.params.username;

    // Find user by username
    const user = await UserModel.findOne({
      where: { user_name: username },
      attributes: ['id', 'user_name', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return next(new ErrorResponse(404, 'User not found'));
    }

    // Get count of public snippets created by the user
    const publicSnippetsCount = await SnippetModel.count({
      where: {
        userId: user.id,
        is_public: true
      }
    });

    // Get count of total likes received on the user's public snippets
    const likesCount = await SnippetModel.sum('likes_count', {
      where: {
        userId: user.id,
        is_public: true
      }
    }) || 0;

    // Get all public snippets for the user
    const snippets = await SnippetModel.findAll({
      where: {
        userId: user.id,
        is_public: true
      },
      include: [
        {
          model: TagModel,
          as: 'tags',
          attributes: ['name'],
          through: {
            attributes: []
          }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          publicSnippetsCount,
          likesCount
        },
        snippets
      }
    });
  }
); 