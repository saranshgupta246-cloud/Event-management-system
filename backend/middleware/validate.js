import { z } from "zod";

// Simple XSS sanitizer
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  // Keep URL characters like "/" and "&" intact so we don't break image links,
  // but still neutralize HTML-special characters to avoid XSS.
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// Sanitize all string fields in object
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Prevent NoSQL injection
function sanitizeMongoQuery(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeMongoQuery(obj[key]);
    }
  }
  return obj;
}

// --- Schemas with length limits and format validation ---

const stringId = z.string().min(1, "ID is required").max(100).trim();

export const createClubSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).trim(),
  description: z.string().max(1000).trim().optional().refine((v) => !v || v.length >= 10, { message: "Description must be at least 10 characters" }),
  category: z.string().max(100).trim(),
  logo: z.string().max(500).optional(),
  banner: z.string().max(500).optional(),
  highlightsDriveUrl: z.string().url("Highlights URL must be a valid URL").max(1000).optional(),
  coordinatorEmail: z.string().email().max(255).optional(),
  coordinatorId: z.string().max(100).optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const assignLeaderSchema = z.object({
  userId: stringId,
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100).trim(),
  // Allow long descriptions; frontend handles layout.
  description: z.string().max(10000).trim().optional(),
  clubId: z.string().max(100).optional().nullable(),
  eventDate: z.string().min(1, "Event date is required").max(50).trim(),
  startTime: z.string().max(20).trim().optional(),
  endTime: z.string().max(20).trim().optional(),
  registrationStart: z.string().min(1, "Registration start is required").max(50).trim(),
  registrationEnd: z.string().min(1, "Registration end is required").max(50).trim(),
  location: z.string().max(200).trim().optional(),
  // Allow empty string, null, absolute URL, or local upload path.
  imageUrl: z
    .union([
      z
        .string()
        .max(500)
        .refine(
          (v) => {
            if (!v) return true;
            const isAbsoluteUrl = /^https?:\/\//i.test(v);
            const isLocalUploadPath = v.startsWith("/uploads/");
            return isAbsoluteUrl || isLocalUploadPath;
          },
          { message: "Invalid image URL format" }
        ),
      z.literal(""),
    ])
    .optional()
    .nullable(),
  totalSeats: z.coerce.number().int().min(0, "Total seats cannot be negative").max(100000).optional(),
  availableSeats: z.coerce.number().int().min(0).max(100000).optional(),
  registrationTypes: z.array(z.enum(["solo", "duo", "squad"])).optional(),
  fees: z
    .object({
      solo: z.coerce.number().min(0).optional(),
      duo: z.coerce.number().min(0).optional(),
      squad: z.coerce.number().min(0).optional(),
    })
    .optional(),
  isFree: z
    .object({
      solo: z.boolean().optional(),
      duo: z.boolean().optional(),
      squad: z.boolean().optional(),
    })
    .optional(),
  teamSize: z
    .object({
      min: z.coerce.number().int().min(2).max(10).optional(),
      max: z.coerce.number().int().min(2).max(10).optional(),
    })
    .optional(),
  upiId: z.string().max(120).trim().optional(),
  upiQrImageUrl: z
    .union([
      z
        .string()
        .max(500)
        .refine(
          (v) => {
            if (!v) return true;
            const isAbsoluteUrl = /^https?:\/\//i.test(v);
            const isLocalUploadPath = v.startsWith("/uploads/");
            return isAbsoluteUrl || isLocalUploadPath;
          },
          { message: "Invalid UPI QR image URL format" }
        ),
      z.literal(""),
    ])
    .optional()
    .nullable(),
  isRecommended: z.boolean().optional(),
  isWorkshop: z.boolean().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const approveMemberSchema = z.object({
  membershipId: stringId,
});

export const joinClubSchema = z.object({
  clubId: stringId,
});

export function validateSchema(schema) {
  return (req, res, next) => {
    try {
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      const result = schema.safeParse(req.body);
      if (!result.success) {
        console.error("[validateSchema] Validation failed", {
          path: req.path,
          errors: result.error.errors,
        });
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      req.body = result.data;
      req.validated = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      req.params = result.data;
      req.validated = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Middleware to sanitize all requests (NoSQL injection protection)
export function sanitizeRequest(req, res, next) {
  if (req.body) sanitizeMongoQuery(req.body);
  if (req.query) sanitizeMongoQuery(req.query);
  if (req.params) sanitizeMongoQuery(req.params);
  next();
}
