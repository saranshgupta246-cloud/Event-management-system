import crypto from "crypto";

/**
 * Generate a URL-safe random token for join invites.
 */
export function generateJoinInviteToken(length = 32) {
  const bytes = crypto.randomBytes(length);
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

