"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailAddress = validateEmailAddress;
const dns_1 = __importDefault(require("dns"));
// Blocklist of popular temporary / disposable email providers
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com',
    'guerrillamail.com',
    '10minutemail.com',
    'tempmail.com',
    'trashmail.com',
    'sharklasers.com',
    'yopmail.com',
    'dispostable.com',
    'getairmail.com',
    'throwawaymail.com',
    'temp-mail.org',
    'burnermail.io',
    'fakemailgenerator.com',
]);
// Map of common domain typos to legitimate services
const COMMON_TYPO_MAP = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmaik.com': 'gmail.com',
    'gmaild.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yaho.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'iclud.com': 'icloud.com',
    'icoud.com': 'icloud.com',
};
/**
 * Validates syntax, detects disposable domains, checks for domain typos,
 * and performs DNS MX record lookup.
 */
async function validateEmailAddress(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, reason: 'Email address is required.' };
    }
    const trimmed = email.trim().toLowerCase();
    // 1. Basic format / RFC syntax check
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
        return { isValid: false, reason: 'Invalid email format syntax.' };
    }
    const parts = trimmed.split('@');
    if (parts.length !== 2) {
        return { isValid: false, reason: 'Invalid email format.' };
    }
    const [localPart, domain] = parts;
    if (localPart.length > 64) {
        return { isValid: false, reason: 'Email username portion exceeds maximum length.' };
    }
    if (domain.length > 255) {
        return { isValid: false, reason: 'Email domain portion exceeds maximum length.' };
    }
    // 2. Disposable / burner domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return {
            isValid: false,
            reason: 'Disposable and temporary email addresses are not permitted. Please use your work or personal email.',
            domain,
        };
    }
    // 3. Typo detection
    let suggestion;
    if (COMMON_TYPO_MAP[domain]) {
        const suggestedDomain = COMMON_TYPO_MAP[domain];
        suggestion = `${localPart}@${suggestedDomain}`;
    }
    // 4. DNS MX record resolution
    try {
        const mxRecords = await resolveMxWithTimeout(domain, 3000);
        if (!mxRecords || mxRecords.length === 0) {
            return {
                isValid: false,
                reason: `Domain "${domain}" does not have active mail exchange (MX) records to receive emails.`,
                suggestion,
                domain,
                hasMxRecords: false,
            };
        }
        return {
            isValid: true,
            suggestion,
            domain,
            hasMxRecords: true,
        };
    }
    catch (err) {
        // If ENOTFOUND or ENODATA, domain doesn't exist or has no MX
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'EREFUSED') {
            return {
                isValid: false,
                reason: `Email domain "${domain}" could not be found or cannot accept emails.`,
                suggestion,
                domain,
                hasMxRecords: false,
            };
        }
        // In case of network timeout or DNS restriction in dev environments, allow pass with warning
        console.warn(`[EmailValidator] DNS MX check timed out or failed for ${domain}: ${err.message}. Permitting fallback.`);
        return {
            isValid: true,
            suggestion,
            domain,
            hasMxRecords: true,
        };
    }
}
/**
 * Resolves MX records with a bounded timeout so API calls never hang.
 */
function resolveMxWithTimeout(domain, timeoutMs) {
    return new Promise((resolve, reject) => {
        let completed = false;
        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                reject(new Error(`DNS resolution timed out after ${timeoutMs}ms`));
            }
        }, timeoutMs);
        dns_1.default.promises
            .resolveMx(domain)
            .then((records) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                resolve(records);
            }
        })
            .catch((err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timer);
                reject(err);
            }
        });
    });
}
