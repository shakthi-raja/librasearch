/**
 * Response headers that every page carries. The proxy creates one nonce per
 * request; Next.js reads it from the request's Content-Security-Policy header
 * and stamps it on its own inline scripts, and the root layout passes it to the
 * colour-mode script.
 */

export type SecurityOptions = { nonce: string; production: boolean };

export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function contentSecurityPolicy({ nonce, production }: SecurityOptions): string {
  const script = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`];
  // React needs eval in development for its debugging stack traces.
  if (!production) script.push(`'unsafe-eval'`);

  return [
    `default-src 'self'`,
    `script-src ${script.join(" ")}`,
    // style attributes (chart widths, the stack map) cannot carry a nonce
    `style-src 'self' 'unsafe-inline'`,
    // book covers come from Open Library
    `img-src 'self' data: blob: https://covers.openlibrary.org https://archive.org https://*.archive.org`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");
}

export function securityHeaders(options: SecurityOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": contentSecurityPolicy(options),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  if (options.production) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains";
  }
  return headers;
}
