"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRIES = exports.CURRENCY_SYMBOLS = exports.CURRENCY_RATES = exports.CURRENCY_MAP = exports.SUPPORTED_CURRENCIES = void 0;
exports.getCurrencyForCountry = getCurrencyForCountry;
exports.convertCurrency = convertCurrency;
exports.formatCurrency = formatCurrency;
exports.SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸', decimalDigits: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimalDigits: 2 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧', decimalDigits: 2 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 155.0, flag: '🇯🇵', decimalDigits: 0 },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36, flag: '🇨🇦', decimalDigits: 2 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺', decimalDigits: 2 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5, flag: '🇮🇳', decimalDigits: 2 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, flag: '🇨🇳', decimalDigits: 2 },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.90, flag: '🇨🇭', decimalDigits: 2 },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.45, flag: '🇧🇷', decimalDigits: 2 },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', rate: 18.1, flag: '🇲🇽', decimalDigits: 2 },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35, flag: '🇸🇬', decimalDigits: 2 },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.63, flag: '🇳🇿', decimalDigits: 2 },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪', decimalDigits: 2 },
    { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦', decimalDigits: 2 },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.2, flag: '🇿🇦', decimalDigits: 2 },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1380.0, flag: '🇰🇷', decimalDigits: 0 },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.5, flag: '🇸🇪', decimalDigits: 2 },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 10.6, flag: '🇳🇴', decimalDigits: 2 },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 6.88, flag: '🇩🇰', decimalDigits: 2 },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 3.98, flag: '🇵🇱', decimalDigits: 2 },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 32.8, flag: '🇹🇷', decimalDigits: 2 },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 7.81, flag: '🇭🇰', decimalDigits: 2 },
    { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', rate: 32.4, flag: '🇹🇼', decimalDigits: 2 },
    { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', rate: 3.72, flag: '🇮🇱', decimalDigits: 2 },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 36.7, flag: '🇹🇭', decimalDigits: 2 },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.71, flag: '🇲🇾', decimalDigits: 2 },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 16400.0, flag: '🇮🇩', decimalDigits: 0 },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 58.7, flag: '🇵🇭', decimalDigits: 2 },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 25450.0, flag: '🇻🇳', decimalDigits: 0 },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 278.5, flag: '🇵🇰', decimalDigits: 2 },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 117.5, flag: '🇧🇩', decimalDigits: 2 },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1480.0, flag: '🇳🇬', decimalDigits: 2 },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 129.5, flag: '🇰🇪', decimalDigits: 2 },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.0, flag: '🇬🇭', decimalDigits: 2 },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 47.8, flag: '🇪🇬', decimalDigits: 2 },
    { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', rate: 915.0, flag: '🇦🇷', decimalDigits: 2 },
    { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', rate: 935.0, flag: '🇨🇱', decimalDigits: 0 },
    { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', rate: 4100.0, flag: '🇨🇴', decimalDigits: 0 },
    { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', rate: 3.80, flag: '🇵🇪', decimalDigits: 2 },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 23.2, flag: '🇨🇿', decimalDigits: 2 },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', rate: 365.0, flag: '🇭🇺', decimalDigits: 0 },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu', rate: 4.58, flag: '🇷🇴', decimalDigits: 2 },
    { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', rate: 3.64, flag: '🇶🇦', decimalDigits: 2 },
    { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rate: 0.31, flag: '🇰🇼', decimalDigits: 3 },
];
exports.CURRENCY_MAP = exports.SUPPORTED_CURRENCIES.reduce((acc, curr) => {
    acc[curr.code] = curr;
    return acc;
}, {});
exports.CURRENCY_RATES = exports.SUPPORTED_CURRENCIES.reduce((acc, curr) => {
    acc[curr.code] = curr.rate;
    return acc;
}, {});
exports.CURRENCY_SYMBOLS = exports.SUPPORTED_CURRENCIES.reduce((acc, curr) => {
    acc[curr.code] = curr.symbol;
    return acc;
}, {});
exports.COUNTRIES = [
    { name: 'United States', code: 'US', currency: 'USD', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', flag: '🇬🇧' },
    { name: 'India', code: 'IN', currency: 'INR', flag: '🇮🇳' },
    { name: 'Germany', code: 'DE', currency: 'EUR', flag: '🇩🇪' },
    { name: 'France', code: 'FR', currency: 'EUR', flag: '🇫🇷' },
    { name: 'Canada', code: 'CA', currency: 'CAD', flag: '🇨🇦' },
    { name: 'Australia', code: 'AU', currency: 'AUD', flag: '🇦🇺' },
    { name: 'Japan', code: 'JP', currency: 'JPY', flag: '🇯🇵' },
    { name: 'China', code: 'CN', currency: 'CNY', flag: '🇨🇳' },
    { name: 'Brazil', code: 'BR', currency: 'BRL', flag: '🇧🇷' },
    { name: 'Mexico', code: 'MX', currency: 'MXN', flag: '🇲🇽' },
    { name: 'Singapore', code: 'SG', currency: 'SGD', flag: '🇸🇬' },
    { name: 'United Arab Emirates', code: 'AE', currency: 'AED', flag: '🇦🇪' },
    { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', flag: '🇸🇦' },
    { name: 'Switzerland', code: 'CH', currency: 'CHF', flag: '🇨🇭' },
    { name: 'Netherlands', code: 'NL', currency: 'EUR', flag: '🇳🇱' },
    { name: 'Italy', code: 'IT', currency: 'EUR', flag: '🇮🇹' },
    { name: 'Spain', code: 'ES', currency: 'EUR', flag: '🇪🇸' },
    { name: 'Sweden', code: 'SE', currency: 'SEK', flag: '🇸🇪' },
    { name: 'Norway', code: 'NO', currency: 'NOK', flag: '🇳🇴' },
    { name: 'Denmark', code: 'DK', currency: 'DKK', flag: '🇩🇰' },
    { name: 'Poland', code: 'PL', currency: 'PLN', flag: '🇵🇱' },
    { name: 'South Korea', code: 'KR', currency: 'KRW', flag: '🇰🇷' },
    { name: 'South Africa', code: 'ZA', currency: 'ZAR', flag: '🇿🇦' },
    { name: 'New Zealand', code: 'NZ', currency: 'NZD', flag: '🇳🇿' },
    { name: 'Turkey', code: 'TR', currency: 'TRY', flag: '🇹🇷' },
    { name: 'Hong Kong', code: 'HK', currency: 'HKD', flag: '🇭🇰' },
    { name: 'Taiwan', code: 'TW', currency: 'TWD', flag: '🇹🇼' },
    { name: 'Israel', code: 'IL', currency: 'ILS', flag: '🇮🇱' },
    { name: 'Thailand', code: 'TH', currency: 'THB', flag: '🇹🇭' },
    { name: 'Malaysia', code: 'MY', currency: 'MYR', flag: '🇲🇾' },
    { name: 'Indonesia', code: 'ID', currency: 'IDR', flag: '🇮🇩' },
    { name: 'Philippines', code: 'PH', currency: 'PHP', flag: '🇵🇭' },
    { name: 'Vietnam', code: 'VN', currency: 'VND', flag: '🇻🇳' },
    { name: 'Pakistan', code: 'PK', currency: 'PKR', flag: '🇵🇰' },
    { name: 'Bangladesh', code: 'BD', currency: 'BDT', flag: '🇧🇩' },
    { name: 'Nigeria', code: 'NG', currency: 'NGN', flag: '🇳🇬' },
    { name: 'Kenya', code: 'KE', currency: 'KES', flag: '🇰🇪' },
    { name: 'Ghana', code: 'GH', currency: 'GHS', flag: '🇬🇭' },
    { name: 'Egypt', code: 'EG', currency: 'EGP', flag: '🇪🇬' },
    { name: 'Argentina', code: 'AR', currency: 'ARS', flag: '🇦🇷' },
    { name: 'Chile', code: 'CL', currency: 'CLP', flag: '🇨🇱' },
    { name: 'Colombia', code: 'CO', currency: 'COP', flag: '🇨🇴' },
    { name: 'Peru', code: 'PE', currency: 'PEN', flag: '🇵🇪' },
    { name: 'Czech Republic', code: 'CZ', currency: 'CZK', flag: '🇨🇿' },
    { name: 'Hungary', code: 'HU', currency: 'HUF', flag: '🇭🇺' },
    { name: 'Romania', code: 'RO', currency: 'RON', flag: '🇷🇴' },
    { name: 'Kuwait', code: 'KW', currency: 'KWD', flag: '🇰🇼' },
    { name: 'Qatar', code: 'QA', currency: 'QAR', flag: '🇶🇦' },
];
const COUNTRY_ALIASES = {
    us: 'USD',
    usa: 'USD',
    america: 'USD',
    'united states': 'USD',
    'united states of america': 'USD',
    uk: 'GBP',
    'united kingdom': 'GBP',
    'great britain': 'GBP',
    britain: 'GBP',
    england: 'GBP',
    india: 'INR',
    bharat: 'INR',
    in: 'INR',
    germany: 'EUR',
    france: 'EUR',
    italy: 'EUR',
    spain: 'EUR',
    netherlands: 'EUR',
    japan: 'JPY',
    canada: 'CAD',
    australia: 'AUD',
    china: 'CNY',
    singapore: 'SGD',
    uae: 'AED',
    'united arab emirates': 'AED',
    dubai: 'AED',
    saudi: 'SAR',
    'saudi arabia': 'SAR',
};
function getCurrencyForCountry(countryInput) {
    if (!countryInput || typeof countryInput !== 'string')
        return null;
    const normalized = countryInput.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    if (!normalized)
        return null;
    if (COUNTRY_ALIASES[normalized]) {
        const code = COUNTRY_ALIASES[normalized];
        return exports.CURRENCY_MAP[code] || null;
    }
    const exactMatch = exports.COUNTRIES.find((c) => c.name.toLowerCase() === normalized || c.code.toLowerCase() === normalized);
    if (exactMatch) {
        return exports.CURRENCY_MAP[exactMatch.currency] || null;
    }
    return null;
}
function convertCurrency(amount, fromCurrency, toCurrency = 'USD') {
    if (fromCurrency === toCurrency)
        return amount;
    const fromRate = exports.CURRENCY_RATES[fromCurrency] || 1.0;
    const toRate = exports.CURRENCY_RATES[toCurrency] || 1.0;
    const inUSD = amount / fromRate;
    return Math.round(inUSD * toRate * 100) / 100;
}
function formatCurrency(amount, currency = 'USD') {
    const curr = exports.CURRENCY_MAP[currency];
    const symbol = curr ? curr.symbol : exports.CURRENCY_SYMBOLS[currency] || '$';
    const decimals = curr?.decimalDigits !== undefined ? curr.decimalDigits : (currency === 'JPY' ? 0 : 2);
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
}
