import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";

const FONTS = {
  serif: "Georgia",
  "sans-serif": "Arial",
  script: "Georgia",
};

export async function generateCertificateImage(certificate, template, student) {
  if (!template?.imageUrl) {
    throw new Error("Template imageUrl is required to generate certificate");
  }

  const imageResponse = await fetch(template.imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch template image: ${imageResponse.status}`);
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || template.imageWidth || 794;
  const imgHeight = metadata.height || template.imageHeight || 1123;

  const canvas = createCanvas(imgWidth, imgHeight);
  const ctx = canvas.getContext("2d");

  const img = await loadImage(imageBuffer);
  ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

  const namePos = template.namePosition || { x: 50, y: 55 };
  const nameX = (namePos.x / 100) * imgWidth;
  const nameY = (namePos.y / 100) * imgHeight;

  const style = template.nameStyle || {};
  const fontSize = style.fontSize || 64;
  const fontFamily = FONTS[style.fontFamily] || "Georgia";
  const fontWeight = style.bold ? "bold" : "normal";

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = style.color || "#1a1a2e";
  ctx.textAlign = style.align || "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  const displayName = student?.name || certificate?.snapshot?.studentName || "Student Name";
  ctx.fillText(displayName, nameX, nameY);
  ctx.shadowColor = "transparent";

  if (template.showVerificationId !== false && certificate?.certificateId) {
    const vPos = template.verificationIdPosition || { x: 50, y: 92 };
    const vx = (vPos.x / 100) * imgWidth;
    const vy = (vPos.y / 100) * imgHeight;

    ctx.font = `11px "Arial"`;
    ctx.fillStyle = "#888888";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Ver. ID: ${certificate.certificateId}`, vx, vy);
  }

  if (template.showQR !== false && certificate?.certificateId) {
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const qrUrl = `${baseUrl}/verify/${certificate.certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: template.qrSize || 80,
      margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });

    const qrImg = await loadImage(qrDataUrl);
    const qrSize = template.qrSize || 80;
    const qrPos = template.qrPosition || { x: 85, y: 85 };
    const qrX = (qrPos.x / 100) * imgWidth - qrSize / 2;
    const qrY = (qrPos.y / 100) * imgHeight - qrSize / 2;

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  }

  const pngBuffer = canvas.toBuffer("image/png");

  const pdfBuffer = await sharp(pngBuffer)
    .toFormat("pdf")
    .toBuffer()
    .catch(async () => pngBuffer);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mits-certificates",
        public_id: certificate.certificateId,
        resource_type: "raw",
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(pdfBuffer);
  });

  const thumbResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mits-certificate-thumbs",
        public_id: `${certificate.certificateId}_thumb`,
        resource_type: "image",
        format: "png",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(pngBuffer);
  });

  return {
    pdfUrl: uploadResult.secure_url,
    thumbnailUrl: thumbResult.secure_url,
  };
}

export async function previewCertificate(
  templateImageUrl,
  nameText,
  namePosition,
  nameStyle,
  imageWidth,
  imageHeight
) {
  const imageResponse = await fetch(templateImageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch template image: ${imageResponse.status}`);
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || imageWidth || 794;
  const imgHeight = metadata.height || imageHeight || 1123;

  const canvas = createCanvas(imgWidth, imgHeight);
  const ctx = canvas.getContext("2d");

  const img = await loadImage(imageBuffer);
  ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

  const pos = namePosition || { x: 50, y: 55 };
  const nameX = (pos.x / 100) * imgWidth;
  const nameY = (pos.y / 100) * imgHeight;

  const style = nameStyle || {};
  const fontSize = style.fontSize || 64;
  const fontFamily = FONTS[style.fontFamily] || "Georgia";
  const fontWeight = style.bold ? "bold" : "normal";

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = style.color || "#1a1a2e";
  ctx.textAlign = style.align || "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 4;
  ctx.fillText(nameText || "Rahul Sharma", nameX, nameY);
  ctx.shadowColor = "transparent";

  return canvas.toBuffer("image/png").toString("base64");
}

