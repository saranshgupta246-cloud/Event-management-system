import { z } from "zod";

export const createClubSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const assignLeaderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  clubId: z.string().optional().nullable(),
  eventDate: z.string().min(1, "Event date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  registrationStart: z.string().min(1, "Registration start is required"),
  registrationEnd: z.string().min(1, "Registration end is required"),
  location: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  totalSeats: z.coerce.number().int().min(0, "Total seats cannot be negative").default(0),
  availableSeats: z.coerce.number().int().min(0, "Available seats cannot be negative").optional(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const approveMemberSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
});

export const joinClubSchema = z.object({
  clubId: z.string().min(1, "Club ID is required"),
});

export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const msg = result.error.errors.map((e) => e.message).join("; ");
        return res.status(400).json({ success: false, message: msg });
      }
      req.validated = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ success: false, message: "Validation failed" });
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({ ...req.params, ...req.body });
      if (!result.success) {
        const msg = result.error.errors.map((e) => e.message).join("; ");
        return res.status(400).json({ success: false, message: msg });
      }
      req.validated = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ success: false, message: "Validation failed" });
    }
  };
}
