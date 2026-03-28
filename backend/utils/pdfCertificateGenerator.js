import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveTemplatePath(templateUrl) {
  if (!templateUrl || typeof templateUrl !== "string") {
    throw new Error("templateUrl is required");
  }
  const relative = templateUrl.startsWith("/") ? templateUrl.slice(1) : templateUrl;
  const backendRoot = path.join(__dirname, "..");
  return path.join(backendRoot, relative);
}

/**
 * @param {"merit"|"participation"} slot
 */
function pickTemplateUrl(event, slot) {
  const merit = event.meritTemplateUrl || "";
  const part = event.participationTemplateUrl || "";
  if (slot === "participation") {
    return part || merit || "";
  }
  return merit || part || "";
}

/**
 * Generate a filled PDF certificate from a local template file.
 * @returns {Promise<Buffer>}
 */
export async function generateCertificatePdfFromEventTemplate({
  event,
  certificate,
  student,
  /** 'merit' uses merit slot (winner/merit), 'participation' uses participation slot */
  templateSlot,
}) {
  const slot = templateSlot === "participation" ? "participation" : "merit";
  const templateUrl = pickTemplateUrl(event, slot);
  if (!templateUrl) {
    throw new Error(
      `No PDF template uploaded for this certificate type (${slot})`
    );
  }

  const localPath = resolveTemplatePath(templateUrl);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Certificate template file not found: ${localPath}`);
  }

  const templateBytes = fs.readFileSync(localPath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();

  const coords = event.certificateCoords || {};
  const fontSize = coords.fontSize || 24;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const name =
    student?.name || certificate?.snapshot?.studentName || "Student Name";
  const eventTitle =
    event?.title || certificate?.snapshot?.eventTitle || "Event";
  const eventDateStr =
    certificate?.snapshot?.eventDate ||
    (event?.eventDate
      ? new Date(event.eventDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "");

  const positionText =
    certificate?.rank
      ? `${certificate.rank} Position`
      : certificate?.achievement && certificate.type !== "participation"
        ? String(certificate.achievement).slice(0, 80)
        : "";

  /** Treat coords as points measured from the top edge (common for designers). */
  const yFromBottom = (yFromTop) => Math.max(0, height - yFromTop);

  const draw = (text, x, yFromTop, size = fontSize) => {
    if (!text) return;
    page.drawText(text, {
      x,
      y: yFromBottom(yFromTop),
      size,
      font,
      color: rgb(0.1, 0.12, 0.2),
    });
  };

  draw(name, coords.nameX ?? 200, coords.nameY ?? 400, fontSize + 8);
  draw(eventTitle, coords.eventX ?? 200, coords.eventY ?? 350, fontSize - 2);
  draw(eventDateStr, coords.dateX ?? 200, coords.dateY ?? 300, fontSize - 4);
  if (positionText && slot !== "participation") {
    draw(positionText, coords.positionX ?? 200, coords.positionY ?? 250, fontSize - 4);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
