"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = escapeRegex;
/**
 * Escapes regex special characters to prevent ReDoS or malformed regex injection
 * when constructing RegExp queries from user input.
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
