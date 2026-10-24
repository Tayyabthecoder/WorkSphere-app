"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApiResponse = sendApiResponse;
exports.sendApiError = sendApiError;
function sendApiResponse(res, data, status = 200, meta) {
    return res.status(status).json({
        success: true,
        data,
        meta: meta || null,
        error: null,
    });
}
function sendApiError(res, error, status = 400) {
    let code = 'BAD_REQUEST';
    let message = 'An unexpected error occurred';
    let details = undefined;
    if (typeof error === 'object' && error !== null) {
        const err = error;
        if (typeof err.code === 'string')
            code = err.code;
        if (typeof err.message === 'string')
            message = err.message;
        if (err.details !== undefined)
            details = err.details;
    }
    else if (typeof error === 'string') {
        message = error;
    }
    return res.status(status).json({
        success: false,
        data: null,
        error: {
            code,
            message,
            details,
        },
    });
}
