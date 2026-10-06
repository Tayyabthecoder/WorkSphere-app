import nodemailer, { type Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }

  return null;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'WorkSphere <notifications@worksphere.io>';

  if (!mailer) {
    // In dev or if SMTP not configured, log simulated email dispatch
    console.log(`📨 [Simulated Email] To: ${options.to} | Subject: "${options.subject}"`);
    return true;
  }

  try {
    await mailer.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [Email Error] Failed to send email to ${options.to}:`, err.message);
    return false;
  }
}
