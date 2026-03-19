import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

function getExtensionFromMime(mimetype) {
  if (!mimetype) return "bin";
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") return "jpg";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  if (mimetype === "application/pdf") return "pdf";
  const parts = mimetype.split("/");
  return parts[1] || "bin";
}

/**
 * Save a buffer to backend/uploads/<folder>/<uuid>.<ext>
 * and return the public URL path /uploads/<folder>/<uuid>.<ext>
 */
export async function localUpload({ buffer, mimetype, folder, filename }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("localUpload: buffer is required");
  }
  const safeFolder = folder || "misc";
  const ext = (filename && path.extname(filename).slice(1)) || getExtensionFromMime(mimetype);
  const id = crypto.randomUUID().replace(/-/g, "");
  const finalName = `${id}.${ext}`;

  const dir = path.join(UPLOAD_ROOT, safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });

  const fullPath = path.join(dir, finalName);
  await fs.promises.writeFile(fullPath, buffer);

  const urlPath = `/uploads/${encodeURIComponent(safeFolder)}/${encodeURIComponent(finalName)}`;
  return urlPath;
}

