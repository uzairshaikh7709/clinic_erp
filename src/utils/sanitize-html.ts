/**
 * Server-safe HTML sanitizer. Strips dangerous tags, event handlers, and script URLs.
 * For use in server components where DOMPurify is not available.
 * TipTap already sanitizes on input — this is defense-in-depth against direct DB edits.
 */
export function sanitizeHtml(html: string): string {
    // Remove script, style, iframe, object, embed, form, link, meta tags entirely (including contents)
    let clean = html.replace(/<(script|style|iframe|object|embed|form|link|meta)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove self-closing dangerous tags
    clean = clean.replace(/<(script|style|iframe|object|embed|form|link|meta)\b[^>]*\/?>/gi, '')
    // Remove on* event handlers from all tags
    clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: and data: URLs from href/src
    clean = clean.replace(/(href|src)\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, '')

    return clean
}
