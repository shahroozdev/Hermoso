/* eslint-disable no-console */
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

interface BrandedEmailOptions {
  preheader?: string;
  title: string;
  greeting?: string;
  body: string;
  action?: { label: string; url: string };
}

// Table/in-line-style layout is intentional: it remains reliable in Gmail,
// Outlook, and mobile mail clients where modern CSS support varies.
export const brandedEmail = ({ preheader = '', title, greeting, body, action }: BrandedEmailOptions) => {
  const clientUrl = (process.env.CLIENT_URL || 'https://hermoso.app').replace(/\/$/, '');
  const logoUrl = process.env.EMAIL_LOGO_URL || `${clientUrl}/android-chrome-192x192.png`;
  const links = [
    ['Privacy Policy', '/privacy-policy'],
    ['Terms & Conditions', '/terms-and-conditions'],
    ['Cancellation & Refund', '/refund-policy'],
    ['Support', 'mailto:support@hermoso.app']
  ];
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;color:#1e1b4b">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5fb;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px">
        <tr><td align="center" style="padding:38px 24px;background:linear-gradient(135deg,#26135c,#5b21b6);border-radius:20px 20px 0 0;color:#fff">
          <img src="${logoUrl}" width="56" height="56" alt="Hermoso" style="display:block;border:0;border-radius:14px;margin:0 auto 12px" />
          <div style="font-size:25px;font-weight:700;letter-spacing:.2px">Hermoso App</div>
          <div style="margin-top:7px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#ddd6fe">AI Aesthetic Care, Simplified</div>
        </td></tr>
        <tr><td style="padding:32px;background:#fff;border:1px solid #e8e7ef;border-top:0">
          <h1 style="margin:0 0 18px;font-size:24px;line-height:32px;color:#24134f">${title}</h1>
          ${greeting ? `<p style="margin:0 0 14px;font-size:16px;line-height:24px">${greeting}</p>` : ''}
          <div style="font-size:16px;line-height:25px;color:#4b4766">${body}</div>
          ${action ? `<p style="margin:26px 0 0"><a href="${action.url}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${action.label}</a></p>` : ''}
        </td></tr>
        <tr><td align="center" style="padding:24px 12px;color:#6b6680;font-size:12px;line-height:20px">
          <div>${links.map(([label, path]) => `<a href="${path.startsWith('mailto:') ? path : clientUrl + path}" style="color:#5b21b6;text-decoration:none;margin:0 6px">${label}</a>`).join(' · ')}</div>
          <div style="margin-top:10px">© ${new Date().getFullYear()} Hermoso App. You received this email because of activity on your Hermoso account.</div>
        </td></tr>
      </table>
    </td></tr></table></body></html>`;
};

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
