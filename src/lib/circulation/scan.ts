/**
 * What a scanner read: a copy label (its barcode, or the URL its QR encodes)
 * or a member's digital library card. Anything else is not ours.
 */
export type Scan = { kind: "copy"; barcode: string } | { kind: "card"; token: string };

export const CARD_PREFIX = "LSCARD:";

const BARCODE = /^LS\d{8}$/;
const BARCODE_IN_URL = /\/c\/(LS\d{8})(?:[/?#]|$)/;

export function parseScan(raw: string): Scan | null {
  const text = raw.trim();
  if (text.startsWith(CARD_PREFIX)) {
    const token = text.slice(CARD_PREFIX.length);
    return /^[A-Z0-9]{4,20}\.\d{10}\.[A-Za-z0-9_-]{22}$/.test(token)
      ? { kind: "card", token }
      : null;
  }
  const upper = text.toUpperCase();
  if (BARCODE.test(upper)) return { kind: "copy", barcode: upper };
  const inUrl = BARCODE_IN_URL.exec(text);
  return inUrl?.[1] ? { kind: "copy", barcode: inUrl[1] } : null;
}

/** The URL a copy's label QR encodes; any phone camera opens it. */
export function labelUrl(appUrl: string, barcode: string): string {
  return new URL(`/c/${barcode}`, appUrl).toString();
}
