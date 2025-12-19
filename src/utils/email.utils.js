import axios from "axios";

export const sendOTPEmail = async (email, otp, name) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: email,
            name: name || "Student",
          },
        ],
        subject: "Verify Your Email - Aagman",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px">
            <h2>Hello ${name || "Student"},</h2>
            <p>Your OTP for email verification is:</p>
            <h1 style="letter-spacing: 6px">${otp}</h1>
            <p>This OTP will expire in <b>10 minutes</b>.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("✅ OTP email sent via Brevo API:", response.data.messageId);
    return { success: true };
  } catch (error) {
    console.error(
      "❌ Brevo API email failed:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send OTP email via Brevo API");
  }
};
