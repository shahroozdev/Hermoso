 
import crypto from 'crypto';
import { brandedEmail, sendEmail } from './email.service.js';

const otpTtlMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);

export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');

export const getOtpExpiry = () => new Date(Date.now() + otpTtlMinutes * 60 * 1000);

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  await sendEmail({
    to: email,
    subject: 'Hermoso OTP Verification Code',
    html: brandedEmail({
      preheader: `Your Hermoso verification code is ${otp}`,
      title: 'Your verification code',
      greeting: `Hi ${name || 'there'},`,
      body: `<p style="margin:0 0 18px">Use this one-time code to verify your Hermoso account:</p><div style="margin:0 0 18px;padding:16px;text-align:center;background:#f3efff;border-radius:10px;color:#4c1d95;font-size:30px;font-weight:700;letter-spacing:8px">${otp}</div><p style="margin:0">This code expires in ${otpTtlMinutes} minutes. Never share it with anyone.</p>`
    })
  });
};
