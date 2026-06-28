import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | undefined;

const canSendEmail = (): boolean => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  if (!canSendEmail()) {
    console.log('Email skipped (SMTP not configured):', { to, subject });
    return;
  }

  const tx = getTransporter();
  await tx.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@hermoso.app',
    to,
    subject,
    html
  });
};