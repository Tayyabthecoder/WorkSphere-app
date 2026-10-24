"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailVerificationCode = sendEmailVerificationCode;
exports.verifyEmailVerificationCode = verifyEmailVerificationCode;
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const VerificationCode_js_1 = require("../models/VerificationCode.js");
let cachedTransporter = null;
/**
 * Creates or retrieves the active nodemailer transporter based on environment configuration.
 */
async function getEmailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || (user ? `"WorkSphere" <${user}>` : '"WorkSphere" <noreply@worksphere.app>');
    // If real SMTP credentials are provided in .env
    if (host && user && pass) {
        if (!cachedTransporter) {
            cachedTransporter = nodemailer_1.default.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });
        }
        return { transporter: cachedTransporter, isLive: true, fromAddress };
    }
    // Fallback: If in development, create an Ethereal test inbox transporter so emails can be previewed
    try {
        const testAccount = await nodemailer_1.default.createTestAccount();
        const testTransporter = nodemailer_1.default.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        return {
            transporter: testTransporter,
            isLive: false,
            fromAddress: '"WorkSphere Sandbox" <no-reply@ethereal.email>',
        };
    }
    catch (err) {
        console.warn('[EmailService] Could not initialize Ethereal fallback transporter:', err.message);
        return { transporter: null, isLive: false, fromAddress };
    }
}
/**
 * Generates and dispatches a 6-digit verification code.
 * If SMTP is configured, sends via real email. Otherwise logs preview URL and console code.
 */
async function sendEmailVerificationCode(email, name) {
    const normalizedEmail = email.trim().toLowerCase();
    // Generate cryptographic 6-digit numeric code
    const code = crypto_1.default.randomInt(100000, 999999).toString();
    const expiresInSeconds = 600; // 10 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    // Remove previous codes for this email
    await VerificationCode_js_1.VerificationCodeModel.deleteMany({ email: normalizedEmail, type: 'signup' });
    // Store in database
    await VerificationCode_js_1.VerificationCodeModel.create({
        email: normalizedEmail,
        code,
        type: 'signup',
        attempts: 0,
        expiresAt,
    });
    const { transporter, isLive, fromAddress } = await getEmailTransporter();
    let previewUrl;
    let isRealEmailSent = false;
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A; }
        .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #1B4D3E; padding: 28px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        .otp-box { background: #F1F5F9; border: 2px dashed #1B4D3E; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace, ui-monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1B4D3E; }
        .expiry { font-size: 12px; color: #64748B; margin-top: 8px; }
        .footer { padding: 20px 28px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WorkSphere</h1>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; margin-top: 0; color: #0F172A;">Confirm your email address</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Hi ${name || 'there'},<br><br>
            Welcome to WorkSphere! Please enter the 6-digit confirmation code below to verify your email address and continue your workspace setup:
          </p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
            <div class="expiry">Expires in 10 minutes</div>
          </div>
          <p style="font-size: 12px; color: #64748B; line-height: 1.5;">
            If you did not initiate this request, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WorkSphere Enterprise Project Management.
        </div>
      </div>
    </body>
    </html>
  `;
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: fromAddress,
                to: normalizedEmail,
                subject: `${code} is your WorkSphere verification code`,
                text: `Your WorkSphere confirmation code is ${code}. It expires in 10 minutes.`,
                html: htmlContent,
            });
            if (isLive) {
                isRealEmailSent = true;
                console.log(`[WorkSphere Auth] ✅ Real verification email dispatched to ${normalizedEmail} via SMTP.`);
            }
            else {
                previewUrl = nodemailer_1.default.getTestMessageUrl(info) || undefined;
                console.log(`[WorkSphere Auth] 📨 Test email dispatched. Preview URL: ${previewUrl}`);
            }
        }
        catch (sendErr) {
            console.error('[WorkSphere Auth] ⚠️ Failed to deliver email via transporter:', sendErr.message);
        }
    }
    // Always log clearly to console in dev mode
    console.log('================================================================');
    console.log(`[WorkSphere Auth] 📧 VERIFICATION CODE FOR ${normalizedEmail}:`);
    console.log(`>>> ${code} <<<`);
    if (previewUrl) {
        console.log(`Web Preview: ${previewUrl}`);
    }
    console.log('================================================================');
    const isDev = process.env.NODE_ENV !== 'production';
    return {
        success: true,
        expiresInSeconds,
        debugCode: isDev ? code : undefined,
        previewUrl,
        isRealEmailSent,
        message: isRealEmailSent
            ? `Verification code sent to ${normalizedEmail}. Please check your inbox.`
            : `Verification code generated for ${normalizedEmail}.`,
    };
}
/**
 * Validates a submitted 6-digit verification code.
 */
async function verifyEmailVerificationCode(email, inputCode) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = inputCode.trim();
    const record = await VerificationCode_js_1.VerificationCodeModel.findOne({
        email: normalizedEmail,
        type: 'signup',
    });
    if (!record) {
        return {
            isValid: false,
            message: 'No active verification code found for this email. Please click resend.',
        };
    }
    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
        await VerificationCode_js_1.VerificationCodeModel.deleteOne({ _id: record._id });
        return {
            isValid: false,
            message: 'Verification code has expired. Please click resend to get a fresh code.',
        };
    }
    // Check attempts
    if (record.attempts >= 5) {
        await VerificationCode_js_1.VerificationCodeModel.deleteOne({ _id: record._id });
        return {
            isValid: false,
            message: 'Too many incorrect attempts. Please request a new verification code.',
        };
    }
    // Check match
    if (record.code !== cleanCode) {
        record.attempts += 1;
        await record.save();
        const remaining = 5 - record.attempts;
        return {
            isValid: false,
            message: `Invalid verification code. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
        };
    }
    // Code matches! Remove the code so it cannot be reused
    await VerificationCode_js_1.VerificationCodeModel.deleteOne({ _id: record._id });
    return {
        isValid: true,
    };
}
