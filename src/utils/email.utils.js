import nodemailer from "nodemailer";

/**
 * =========================================================
 * Email Utility – Aagman Gate Pass System
 * =========================================================
 * - Supports Brevo (recommended), MailerSend, SMTP2GO
 * - Handles TLS / self-signed certificate issues
 * - Reuses transporter (no reconnect on every email)
 * - Safe for Render / production
 * =========================================================
 */

/**
 * Get SMTP config based on provider
 */
const getSMTPConfig = () => {
  const provider = (process.env.SMTP_PROVIDER || "brevo").toLowerCase();

  // 🔹 Brevo (Recommended)
  if (provider === "brevo" || provider === "sendinblue") {
    return {
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS,
      },
    };
  }

  // 🔹 MailerSend
  if (provider === "mailersend") {
    return {
      host: process.env.SMTP_HOST || "smtp.mailersend.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS,
      },
    };
  }

  // 🔹 SMTP2GO
  if (provider === "smtp2go") {
    return {
      host: process.env.SMTP_HOST || "mail.smtp2go.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS,
      },
    };
  }

  // 🔹 Fallback (Custom SMTP)
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS,
    },
  };
};

/**
 * Create Nodemailer transporter
 */
const createTransporter = () => {
  const config = getSMTPConfig();

  if (!config.auth.user || !config.auth.pass) {
    throw new Error(
      "SMTP credentials missing. Set SMTP_USER and SMTP_PASS."
    );
  }

  const rejectUnauthorized =
    process.env.SMTP_REJECT_UNAUTHORIZED !== undefined
      ? process.env.SMTP_REJECT_UNAUTHORIZED === "true"
      : process.env.NODE_ENV === "production";

  return nodemailer.createTransport({
    ...config,
    tls: { rejectUnauthorized },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,

  });
};

/**
 * Reuse transporter (IMPORTANT)
 */
let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
};

/**
 * Verify SMTP connection
 */
export const verifySMTPConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: "SMTP verified successfully" };
  } catch (error) {
    return {
      success: false,
      message: "SMTP verification failed",
      error: error.message,
    };
  }
};

/**
 * Send OTP Email
 */
export const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = getTransporter();

    const fromEmail =
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim();

    const fromName =
      process.env.SMTP_FROM_NAME || "Aagman Gate Pass System";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Verify Your Email - Aagman",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px">
          <h2>Hello ${name || "Student"},</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="letter-spacing: 6px">${otp}</h1>
          <p>This OTP will expire in <b>10 minutes</b>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ OTP email failed:", error.message);

    if (error.code === "EAUTH") {
      throw new Error("SMTP authentication failed");
    }
    if (error.code === "ETIMEDOUT") {
      throw new Error("SMTP timeout");
    }
    if (error.code === "ECONNECTION") {
      throw new Error("SMTP connection failed");
    }

    throw new Error("Failed to send OTP email");
  }
};

/**
 * Send Generic Email
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();

    const fromEmail =
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim();

    const fromName =
      process.env.SMTP_FROM_NAME || "Aagman Gate Pass System";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });

    console.log(`✅ Email sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(" Email failed:", error.message);
    throw new Error("Failed to send email");
  }
};
