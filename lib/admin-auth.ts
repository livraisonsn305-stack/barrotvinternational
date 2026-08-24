import { createHmac, timingSafeEqual } from "node:crypto";

import { ADMIN_EMAIL } from "@/lib/admin-config";

export { ADMIN_EMAIL };
export const ADMIN_COOKIE = "bti_admin_session";
export const ADMIN_TOKEN_COOKIE = "bti_admin_session_token";
export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export function signAdminToken(email: string) {
  if (!ADMIN_SESSION_SECRET) {
    return "";
  }

  const payload = `${email}:${Date.now()}`;
  const hash = createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");

  return `${hash}.${Buffer.from(payload).toString("base64url")}`;
}

export function getAdminEmailFromToken(token?: string) {
  if (!token) return null;

  try {
    const [, encodedPayload] = token.split(".");
    if (!encodedPayload) return null;

    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    return payload.split(":")[0] || null;
  } catch {
    return null;
  }
}

export function isValidAdminToken(token?: string) {
  if (!token || !ADMIN_SESSION_SECRET) return false;

  try {
    const [hash, encodedPayload] = token.split(".");
    if (!hash || !encodedPayload) return false;

    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const expectedHash = createHmac("sha256", ADMIN_SESSION_SECRET)
      .update(payload)
      .digest("hex");

    const expected = Buffer.from(expectedHash);
    const actual = Buffer.from(hash);

    if (expected.length !== actual.length) return false;
    if (!timingSafeEqual(expected, actual)) return false;

    return getAdminEmailFromToken(token) === ADMIN_EMAIL;
  } catch {
    return false;
  }
}
