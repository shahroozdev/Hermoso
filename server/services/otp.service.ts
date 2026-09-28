 
import crypto from 'crypto';
import { sendEmail } from './email.service.js';

const otpTtlMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);

export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');

export const getOtpExpiry = () => new Date(Date.now() + otpTtlMinutes * 60 * 1000);

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  await sendEmail({
    to: email,
    subject: 'Hermoso OTP Verification Code',
    html: `<p>Hi ${name || 'there'},</p><p>Your Hermoso OTP is <strong>${otp}</strong>.</p><p>This code expires in ${otpTtlMinutes} minutes.</p>`
  });
};
