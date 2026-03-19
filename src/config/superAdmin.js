export const SUPER_ADMIN_EMAILS = ["saranshgupta246@gmail.com"].map((email) =>
  String(email).trim().toLowerCase()
);

export function isSuperAdminEmail(email) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
}

