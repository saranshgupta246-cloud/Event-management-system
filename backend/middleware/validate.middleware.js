import { validationResult } from "express-validator";

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  const errors = result.array();
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    data: errors,
  });
}
