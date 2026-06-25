import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a verification email to a newly registered user.
 *
 * @param {string} to    - Recipient email address
 * @param {string} name  - Recipient's display name (used in the salutation)
 * @param {string} token - Email verification token
 * @returns {Promise<void>} Resolves on success, throws on failure
 */
export const sendVerificationEmail = async (to, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: "Verify your AI Habit Tracker email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4f46e5;">AI Habit Tracker</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below.</p>
        <p style="margin: 32px 0;">
          <a
            href="${verificationUrl}"
            style="
              background-color: #4f46e5;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            "
          >
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
        <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
          This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
