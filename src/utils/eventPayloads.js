export function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeEventPayload(payload, { partial = false } = {}) {
  const normalized = {};
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  const assignString = (key, transform) => {
    if (!partial || hasOwn(key)) {
      const value = payload[key];
      normalized[key] = transform ? transform(value) : value;
    }
  };

  assignString("title", (v) => (typeof v === "string" ? v.trim() : ""));
  assignString("description", (v) => v || "");
  assignString("clubId", (v) => v || undefined);
  assignString("eventDate");
  assignString("startTime", (v) => v || "");
  assignString("endTime", (v) => v || "");
  assignString("registrationStart", (v) => v || "");
  assignString("registrationEnd", (v) => v || "");
  assignString("location", (v) => v || "");
  assignString("imageUrl", (v) => v || undefined);
  assignString("upiId", (v) => (v || "").trim());
  assignString("upiQrImageUrl", (v) => v || "");
  assignString("status", (v) => v || undefined);
  assignString("approvalStatus", (v) => v || undefined);

  if (!partial || hasOwn("isRecommended")) {
    normalized.isRecommended = !!payload.isRecommended;
  }
  if (!partial || hasOwn("isWorkshop")) {
    normalized.isWorkshop = !!payload.isWorkshop;
  }
  if (!partial || hasOwn("registrationTypes")) {
    normalized.registrationTypes =
      Array.isArray(payload.registrationTypes) && payload.registrationTypes.length > 0
        ? payload.registrationTypes
        : ["solo"];
  }
  if (!partial || hasOwn("fees")) {
    normalized.fees = {
      solo: parseOptionalNumber(payload.fees?.solo) ?? 0,
      duo: parseOptionalNumber(payload.fees?.duo) ?? 0,
      squad: parseOptionalNumber(payload.fees?.squad) ?? 0,
    };
  }
  if (!partial || hasOwn("isFree")) {
    normalized.isFree = {
      solo: payload.isFree?.solo !== false,
      duo: payload.isFree?.duo !== false,
      squad: payload.isFree?.squad !== false,
    };
  }
  if (!partial || hasOwn("teamSize")) {
    normalized.teamSize = {
      min: parseOptionalNumber(payload.teamSize?.min) ?? 2,
      max: parseOptionalNumber(payload.teamSize?.max) ?? 5,
    };
  }

  const totalSeats = parseOptionalNumber(payload.totalSeats);
  const availableSeats = parseOptionalNumber(payload.availableSeats);
  if (!partial) {
    normalized.totalSeats = totalSeats ?? 0;
    normalized.availableSeats = availableSeats ?? normalized.totalSeats;
  } else {
    if (totalSeats !== undefined) normalized.totalSeats = totalSeats;
    if (availableSeats !== undefined) normalized.availableSeats = availableSeats;
  }

  return normalized;
}
