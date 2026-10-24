"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
function getTransporter() {
    if (transporter)
        return transporter;
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
        transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
        return transporter;
    }
    return null;
}
async function sendEmail(options) {
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
    }
    catch (err) {
        console.warn(`⚠️ [Email Error] Failed to send email to ${options.to}:`, err.message);
        return false;
    }
}
