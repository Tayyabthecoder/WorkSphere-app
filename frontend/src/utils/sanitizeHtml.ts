/**
 * Lightweight, zero-dependency browser-native HTML sanitizer.
 * Neutralizes XSS vectors by filtering forbidden tags, event handlers, and malicious URIs.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return rawHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Remove dangerous executable/embed elements
    const forbiddenTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'style',
      'base',
      'meta',
      'link',
      'applet',
    ];
    forbiddenTags.forEach((tag) => {
      const nodes = doc.querySelectorAll(tag);
      nodes.forEach((node) => node.remove());
    });

    // 2. Strip dangerous inline event handlers and malicious protocols
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attributes = Array.from(el.attributes);
      for (const attr of attributes) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();

        // Strip inline event listeners (onclick, onerror, onload, onmouseover, etc.)
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Strip javascript: or data:html URIs in href, src, formaction, etc.
        if (
          (name === 'href' || name === 'src' || name === 'action' || name === 'data') &&
          (value.startsWith('javascript:') ||
            value.startsWith('vbscript:') ||
            value.startsWith('data:text/html') ||
            value.startsWith('data:application/javascript'))
        ) {
          el.removeAttribute(attr.name);
        }
      }

      // Automatically attach secure attributes to external links
      if (el.tagName.toLowerCase() === 'a') {
        const href = el.getAttribute('href') || '';
        if (href.startsWith('http://') || href.startsWith('https://')) {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.error('Failed to sanitize HTML:', err);
    return rawHtml;
  }
}
