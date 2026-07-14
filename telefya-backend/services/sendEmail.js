const nodemailer = require("nodemailer");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing from .env`);
  }

  return value;
}

function getRecipientName(nameInput) {
  if (!nameInput) return "there";

  if (typeof nameInput === "string") {
    return nameInput.trim() || "there";
  }

  if (typeof nameInput === "object") {
    return (
      [nameInput.firstName, nameInput.lastName].filter(Boolean).join(" ") ||
      nameInput.name ||
      nameInput.email ||
      "there"
    );
  }

  return "there";
}

function buildOtpEmail({ otp, recipientName, brandName }) {
  const safeName = escapeHtml(recipientName);
  const safeOtp = escapeHtml(otp);
  const safeBrand = escapeHtml(brandName);

  const text = `Hello ${recipientName},

Your ${brandName} verification code is ${otp}.

This code expires soon. If you did not request this, you can ignore this email.`;

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verify your ${safeBrand} email</title>
  </head>
  <body style="margin:0;background:#f4f7fb;padding:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,#0f6bff,#6426ff,#20c997);"></td>
            </tr>

            <tr>
              <td style="padding:32px 32px 10px;">
                <div style="font-size:26px;font-weight:900;letter-spacing:-0.02em;color:#0f172a;">
                  ${safeBrand}
                </div>
                <div style="margin-top:8px;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;">
                  Email verification
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 32px 0;">
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:900;color:#0f172a;">
                  Verify your email address
                </h1>

                <p style="margin:16px 0 0;font-size:15px;line-height:1.8;color:#475569;">
                  Hello <strong style="color:#0f172a;">${safeName}</strong>, use the code below to finish creating your ${safeBrand} account.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-size:12px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">
                    Verification code
                  </div>
                  <div style="margin-top:12px;font-size:38px;line-height:1;font-weight:900;letter-spacing:0.22em;color:#0f6bff;">
                    ${safeOtp}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 30px;">
                <p style="margin:0;font-size:14px;line-height:1.8;color:#64748b;">
                  This code expires soon. If you did not create a ${safeBrand} account, you can safely ignore this message.
                </p>

                <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:18px;font-size:12px;line-height:1.7;color:#94a3b8;">
                  Sent by ${safeBrand}. Please do not reply to this automated email.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

async function sendEmailWithOTP(email, otp, nameInput = "there") {
  const host = required("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = required("SMTP_USER");
  const pass = required("SMTP_PASS");

  const brandName = process.env.SMTP_FROM_NAME || "Telefya";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  const recipientName = getRecipientName(nameInput);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.verify();

  const { text, html } = buildOtpEmail({
    otp,
    recipientName,
    brandName,
  });

  const info = await transporter.sendMail({
    from: `"${brandName}" <${fromEmail}>`,
    to: email,
    subject: `Verify your ${brandName} email`,
    text,
    html,
  });

  console.log("[Email] OTP email sent", {
    to: email,
    messageId: info.messageId,
  });

  return info;
}

module.exports = sendEmailWithOTP;