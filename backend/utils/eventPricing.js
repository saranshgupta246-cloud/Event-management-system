/** @param {import("mongoose").Types.ObjectId|string} id */
export function feeForRegistrationType(event, type) {
  const t = type || "solo";
  if (!event) return 0;
  if (event.isFree?.[t]) return 0;
  return Math.max(0, Number(event.fees?.[t] ?? 0));
}

/** True if any enabled registration type has a positive fee (needs UPI/QR). */
export function eventRequiresUpi(event) {
  const types =
    Array.isArray(event?.registrationTypes) && event.registrationTypes.length > 0
      ? event.registrationTypes
      : ["solo"];
  return types.some((t) => feeForRegistrationType(event, t) > 0);
}

export function normalizeRegistrationTypes(arr) {
  const allowed = new Set(["solo", "duo", "squad"]);
  if (!Array.isArray(arr) || arr.length === 0) return ["solo"];
  const uniq = [...new Set(arr.filter((x) => allowed.has(String(x))))];
  return uniq.length ? uniq : ["solo"];
}

/** Whether UPI + QR are required given enabled types and per-type free/fee flags. */
export function computeRequiresUpi(registrationTypes, fees, isFree) {
  const types =
    Array.isArray(registrationTypes) && registrationTypes.length > 0 ? registrationTypes : ["solo"];
  return types.some((t) => !isFree?.[t] && Number(fees?.[t] || 0) > 0);
}
