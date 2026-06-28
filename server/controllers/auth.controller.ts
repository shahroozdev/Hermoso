import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, type IUser } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/auth.service.js';
import { generateOtp, getOtpExpiry, hashOtp, sendOtpEmail, sendOtpPhone } from '../services/otp.service.js';
import { Roles} from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../services/email.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/auth.schema.js';

const getTokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const buildAuthPayload = async (user: IUser) => {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });
  const decoded = verifyRefreshToken(refreshToken) as { id: string; exp?: number };

  await RefreshToken.create({
    userId: user._id,
    tokenHash: getTokenHash(refreshToken),
    expiresAt: new Date((decoded.exp || 0) * 1000),
    revokedAt: null
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken
  };
};

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, phone, location } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return next(new ApiError(409, 'Email already registered'));

    const otp = generateOtp();
    const user = await User.create({
      name,
      email,
      password,
      role: role || Roles.CUSTOMER,
      phone,
      location,
      isVerified: false,
      otpCodeHash: hashOtp(otp),
      otpExpiresAt: getOtpExpiry()
    });

    await Promise.all([
      sendOtpEmail(email, name, otp),
    ]);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify OTP sent to your email.',
      data: {
        email: user.email,
        phone: user.phone
      }
    });
  },
  { body: registerSchema.shape.body }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password') as IUser | null;
    if (!user) return next(new ApiError(401, 'Invalid credentials'));

    const match = await user.comparePassword(password);
    if (!match) return next(new ApiError(401, 'Invalid credentials'));
    if (!user.isVerified) return next(new ApiError(403, 'Account not verified. Please verify OTP first.'));

    const tokens = await buildAuthPayload(user);
    user.password = undefined as unknown as string; // Remove password from response

    res.json({ success: true, ...tokens, user: { ...user.toObject(), password: undefined } });
  },
  { body: loginSchema.shape.body }
);

export const verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new ApiError(400, 'email and otp are required'));

  const user = await User.findOne({ email }).select('+otpCodeHash +otpExpiresAt');
  if (!user) return next(new ApiError(404, 'User not found'));
  if (user.isVerified) return res.json({ success: true, message: 'Account already verified' });

  if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
    return next(new ApiError(400, 'OTP expired. Please request a new OTP.'));
  }

  const providedHash = hashOtp(otp);
  if (providedHash !== user.otpCodeHash) return next(new ApiError(400, 'Invalid OTP'));

  user.isVerified = true;
  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  await user.save();

  res.json({ success: true, message: 'OTP verified successfully. You can now login.' });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (!email) return next(new ApiError(400, 'email is required'));

  const user = await User.findOne({ email }).select('+otpCodeHash +otpExpiresAt');
  if (!user) return next(new ApiError(404, 'User not found'));
  if (user.isVerified) return res.json({ success: true, message: 'Account already verified' });

  const otp = generateOtp();
  user.otpCodeHash = hashOtp(otp);
  user.otpExpiresAt = getOtpExpiry();
  await user.save();

  await Promise.all([
    sendOtpEmail(user.email, user.name, otp),
    sendOtpPhone(user.phone || '', otp)
  ]);

  res.json({ success: true, message: 'OTP resent successfully' });
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return next(new ApiError(400, 'refreshToken is required'));

    let decoded: { id: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    const hashed = getTokenHash(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash: hashed, revokedAt: null });
    if (!stored) return next(new ApiError(401, 'Refresh token revoked or not found'));

    if (stored.expiresAt.getTime() <= Date.now()) {
      return next(new ApiError(401, 'Refresh token expired'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new ApiError(401, 'Invalid refresh token user'));

    stored.revokedAt = new Date();
    await stored.save();

    const tokens = await buildAuthPayload(user as IUser);
    res.json({ success: true, ...tokens, user: { ...user.toObject(), password: undefined } });
  },
  { body: refreshTokenSchema.shape.body }
);

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

const resetTokenExpiryMinutes = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES || 60);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');
    if (!user) {
      if (!user) return next(new ApiError(404, 'User not found'));
    }

    const { token, hash } = generateResetToken();
    user.resetPasswordTokenHash = hash;
    user.resetPasswordExpiresAt = new Date(Date.now() + resetTokenExpiryMinutes * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Hermoso Password Reset Request',
      html: `
        <p>Hi ${user.name || 'there'},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in ${resetTokenExpiryMinutes} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  },
  { body: forgotPasswordSchema.shape.body }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, password } = req.body;

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: hash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset token'));
    }

    user.password = password;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  },
  { body: resetPasswordSchema.shape.body }
);

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return next(new ApiError(400, 'Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    res.json({ success: true, message: 'Password changed successfully.' });
  },
  { body: changePasswordSchema.shape.body }
);

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return next(new ApiError(400, 'refreshToken is required'));

    const hashed = getTokenHash(refreshToken);
    await RefreshToken.findOneAndUpdate({ tokenHash: hashed, revokedAt: null }, { revokedAt: new Date() });

    res.json({ success: true, message: 'Logged out successfully' });
  },
  { body: refreshTokenSchema.shape.body }
);
