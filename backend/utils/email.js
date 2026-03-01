import nodemailer from "nodemailer";

let transporterInstance = null;

/**
 * Singleton transporter. Uses env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, FROM_EMAIL, FROM_NAME.
 */
function createTransporter() {
  if (transporterInstance) return transporterInstance;
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
  return transporterInstance;
}

/**
 * Send an email. Returns { success, messageId } or throws.
 * @param {{ to: string, subject: string, html?: string, text?: string }}
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  const from =
    process.env.FROM_EMAIL && process.env.FROM_NAME
      ? `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`
      : process.env.FROM_EMAIL || process.env.SMTP_USER || "noreply@mits.ac.in";

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
  });
  return { success: true, messageId: info.messageId };
}

const PLACEHOLDERS = [
  "applicantName",
  "roleName",
  "clubName",
  "leaderName",
  "deadline",
  "customMessage",
  "applicationLink",
];

/**
 * Replaces {{placeholder}} in template with values from data.
 */
export function replacePlaceholders(template, data = {}) {
  let out = typeof template === "string" ? template : "";
  for (const key of PLACEHOLDERS) {
    const value = data[key];
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value != null ? String(value) : "");
  }
  return out;
}

const EMAIL_HEADER = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #1E3B8A 0%, #2563EB 100%); padding: 24px 20px;">
  <tr>
    <td align="center">
      <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">MITS</span>
      <span style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(255,255,255,0.9); display: block; margin-top: 4px;">Event Management System</span>
    </td>
  </tr>
</table>`;

const EMAIL_FOOTER = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #F8FAFC; padding: 20px; margin-top: 24px;">
  <tr>
    <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #64748B;">
      MITS Event Management System — Club Recruitment
      <br/>
      <span style="margin-top: 8px; display: inline-block;">You are receiving this because you applied via our portal. To manage preferences, visit your dashboard.</span>
    </td>
  </tr>
</table>`;

const BODY_WRAPPER = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MITS EMS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto;">
    ${EMAIL_HEADER}
    <tr>
      <td style="background: #ffffff; padding: 28px 24px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
        ${content}
      </td>
    </tr>
    ${EMAIL_FOOTER}
  </table>
</body>
</html>`;

const CTA_BUTTON = (text, urlPlaceholder = "{{applicationLink}}") =>
  `
<table cellpadding="0" cellspacing="0" role="presentation" style="margin: 20px 0;">
  <tr>
    <td>
      <a href="${urlPlaceholder}" target="_blank" rel="noopener" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">${text}</a>
    </td>
  </tr>
</table>`;

export const SHORTLIST_TEMPLATE = {
  subject: "🎉 You've been Shortlisted — {{roleName}} at {{clubName}}",
  html: BODY_WRAPPER(`
    <p style="margin: 0 0 16px;">Hi {{applicantName}},</p>
    <p style="margin: 0 0 16px;">Congratulations! You have been <strong>shortlisted</strong> for the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
    <p style="margin: 0 0 16px;">We were impressed by your application. Our team will reach out with next steps—please keep an eye on your email and the club portal.</p>
    ${CTA_BUTTON("View your application")}
    <p style="margin: 16px 0 0; color: #64748B; font-size: 14px;">Best regards,<br/><strong>{{clubName}}</strong> Team</p>
  `),
};

export const INTERVIEW_TEMPLATE = {
  subject: "Interview Invitation — {{roleName}} at {{clubName}}",
  html: BODY_WRAPPER(`
    <p style="margin: 0 0 16px;">Hi {{applicantName}},</p>
    <p style="margin: 0 0 16px;">You are invited for an <strong>interview</strong> for the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
    <p style="margin: 0 0 16px;">Please reply to this email or contact the club with your available times so we can schedule the interview.</p>
    <p style="margin: 0 0 16px;">{{customMessage}}</p>
    ${CTA_BUTTON("Open application")}
    <p style="margin: 16px 0 0; color: #64748B; font-size: 14px;">Best regards,<br/><strong>{{clubName}}</strong> Team</p>
  `),
};

export const REJECTION_TEMPLATE = {
  subject: "Application Update — {{roleName}} at {{clubName}}",
  html: BODY_WRAPPER(`
    <p style="margin: 0 0 16px;">Hi {{applicantName}},</p>
    <p style="margin: 0 0 16px;">Thank you for applying for the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
    <p style="margin: 0 0 16px;">After careful consideration, we have decided to move forward with other candidates for this role. We encourage you to apply for future opportunities with us.</p>
    <p style="margin: 0 0 16px;">{{customMessage}}</p>
    <p style="margin: 16px 0 0; color: #64748B; font-size: 14px;">Best regards,<br/><strong>{{clubName}}</strong> Team</p>
  `),
};

export const OFFER_TEMPLATE = {
  subject: "🎊 Offer Letter — {{roleName}} at {{clubName}}",
  html: BODY_WRAPPER(`
    <p style="margin: 0 0 16px;">Hi {{applicantName}},</p>
    <p style="margin: 0 0 16px;">We are pleased to offer you the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>!</p>
    <p style="margin: 0 0 16px;">Welcome to the team. Please confirm your acceptance and next steps will be shared shortly.</p>
    <p style="margin: 0 0 16px;">{{customMessage}}</p>
    ${CTA_BUTTON("Confirm & view details")}
    <p style="margin: 16px 0 0; color: #64748B; font-size: 14px;">Congratulations!<br/><strong>{{clubName}}</strong> Team</p>
  `),
};

export const DEFAULT_TEMPLATES = {
  shortlist: SHORTLIST_TEMPLATE,
  interview: INTERVIEW_TEMPLATE,
  rejection: REJECTION_TEMPLATE,
  offer: OFFER_TEMPLATE,
};

export default sendEmail;
