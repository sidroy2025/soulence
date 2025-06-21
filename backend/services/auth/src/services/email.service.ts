import nodemailer from 'nodemailer';
import { config, logger } from '@soulence/utils';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${BASE_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@soulence.app',
    to: email,
    subject: 'Verify your Soulence account',
    html: `
      <h2>Welcome to Soulence!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account with Soulence, please ignore this email.</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', { email, error });
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@soulence.app',
    to: email,
    subject: 'Reset your Soulence password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to create a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent', { email });
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error });
    throw error;
  }
}

export async function sendParentNotification(parentEmail: string, childEmail: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@soulence.app',
    to: parentEmail,
    subject: 'Your child has joined Soulence',
    html: `
      <h2>Child Account Created</h2>
      <p>This is to inform you that a Soulence account has been created for:</p>
      <p><strong>${childEmail}</strong></p>
      <p>Soulence is a mental wellness app designed to support students' emotional and academic well-being.</p>
      <h3>What you can do as a parent:</h3>
      <ul>
        <li>Create your own parent account to monitor your child's progress</li>
        <li>Receive insights about your child's emotional well-being (with their consent)</li>
        <li>Get alerts in case of crisis situations</li>
      </ul>
      <p>To create your parent account, visit: ${BASE_URL}/register</p>
      <p>If you have any questions or concerns, please contact our support team.</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Parent notification sent', { parentEmail, childEmail });
  } catch (error) {
    logger.error('Failed to send parent notification', { parentEmail, error });
    // Don't throw - this shouldn't block registration
  }
}

export async function sendCrisisAlert(emails: string[], studentName: string, severity: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@soulence.app',
    to: emails.join(','),
    subject: `URGENT: Crisis Alert for ${studentName}`,
    priority: 'high',
    html: `
      <h2 style="color: red;">Crisis Alert</h2>
      <p>This is an automated alert from Soulence regarding <strong>${studentName}</strong>.</p>
      <p>Our system has detected patterns indicating potential emotional distress.</p>
      <p><strong>Severity Level: ${severity}</strong></p>
      <h3>Recommended Actions:</h3>
      <ul>
        <li>Check in with the student immediately</li>
        <li>Consider contacting their therapist or counselor</li>
        <li>Review recent mood logs and activity in the app</li>
      </ul>
      <p>For immediate help, contact:</p>
      <ul>
        <li>National Suicide Prevention Lifeline: 988</li>
        <li>Crisis Text Line: Text HOME to 741741</li>
      </ul>
      <p>Login to Soulence for more details: ${BASE_URL}</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Crisis alert sent', { recipients: emails.length, studentName, severity });
  } catch (error) {
    logger.error('Failed to send crisis alert', { emails, error });
    throw error;
  }
}