/**
 * Escapes regex special characters to prevent ReDoS or malformed regex injection
 * when constructing RegExp queries from user input.
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
