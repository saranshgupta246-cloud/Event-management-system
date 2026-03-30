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
 * Text is horizontally centered; only Y positions are configured.
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
  const fontSize = coords.fontSize || 28;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const name =
    student?.name || certificate?.snapshot?.studentName || "Student Name";

  const positionText =
    certificate?.rank
      ? `${certificate.rank} Position`
      : certificate?.achievement && certificate.type !== "participation"
        ? String(certificate.achievement).slice(0, 80)
        : "";

  /** Y measured from top edge; pdf-lib uses bottom-left origin */
  const yFromBottom = (yFromTop) => Math.max(0, height - yFromTop);

  const drawCentered = (text, yFromTop, size, useFont) => {
    if (!text) return;
    const f = useFont || font;
    const textWidth = f.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    page.drawText(text, {
      x,
      y: yFromBottom(yFromTop),
      size,
      font: f,
      color: rgb(0.1, 0.12, 0.2),
    });
  };

  const nameY = coords.nameY ?? 400;
  drawCentered(name, nameY, fontSize, boldFont);

  if (positionText && slot !== "participation") {
    const posY = coords.positionY ?? 450;
    drawCentered(positionText, posY, coords.positionFontSize || 20, font);
  }

  if (coords.rollNoEnabled) {
    const rollNo = certificate?.snapshot?.studentRollNo || "";
    if (rollNo) {
      const rollY = coords.rollNoY ?? 470;
      drawCentered(String(rollNo), rollY, 14, font);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
