import { Resend } from 'resend';
import { Headers } from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: './src/config/.env' });

// Make Headers available globally for Resend
if (!global.Headers) {
  (global as any).Headers = Headers;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  /**
   * Send verification email
   * @param email Recipient email address
   * @param verificationToken Verification token
   * @param username User's name
   */
  static async sendVerificationEmail(
    email: string,
    verificationToken: string,
    username: string
  ): Promise<void> {

    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Replace with your production domain
        : `http://localhost:${process.env.PORT || 3000}`;
        
      const verificationUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

      console.log(verificationUrl);
      
      await resend.emails.send({
        from: process.env.RESEND_AUTHORIZED_EMAIL ?? 'contact@ezrdp.com',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${username},</h2>
            <p>Thank you for registering with Snippet Box. To complete your registration, please verify your email address.</p>
            <p style="margin: 25px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not sign up for Snippet Box, please ignore this email.</p>
            <p>Best regards,<br>The Snippet Box Team</p>
          </div>
        `,
      });

      console.info(`Verification email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending verification email to ${email}: ${error}`);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param email Recipient email address
   * @param resetToken Reset token
   * @param username User's name
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    username: string
  ): Promise<void> {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Replace with your production domain
        : `http://localhost:${process.env.PORT || 5000}`;
        
      const resetUrl = `${baseUrl}/api/auth/reset-password/${resetToken}`;
      
      await resend.emails.send({
        from: process.env.RESEND_AUTHORIZED_EMAIL ?? 'contact@ezrdp.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${username},</h2>
            <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
            <p style="margin: 25px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p>Best regards,<br>The Snippet Box Team</p>
          </div>
        `,
      });

      console.info(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending password reset email to ${email}: ${error}`);
      throw new Error('Failed to send password reset email');
    }
  }
} 