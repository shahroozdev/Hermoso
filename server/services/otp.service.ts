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

export const sendOtpPhone = async (phone: string, otp: string) => {
  if (!phone) return;

  if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_FROM) {
    try {
      await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.WHATSAPP_FROM,
          to: phone,
          message: `Your Hermoso OTP is ${otp}. Expires in ${otpTtlMinutes} minutes.`
        })
      });
      return;
    } catch (error) {
      console.log('WhatsApp OTP send failed, fallback to log:', error);
    }
  }

  console.log(`OTP for phone ${phone}: ${otp}`);
};
