/**
 * Send a verification email to a newly registered user via Brevo API.
 * Uses native fetch (no extra package) over HTTPS — works on Render free tier.
 *
 * @param {string} to    - Recipient email address
 * @param {string} name  - Recipient's display name (used in the salutation)
 * @param {string} token - Email verification token
 * @returns {Promise<void>} Resolves on success, throws on failure
 */
export const sendVerificationEmail = async (to, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "AI Habit Tracker",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to, name }],
      subject: "Verify your AI Habit Tracker email",
      htmlContent: `
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
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Brevo API error: ${response.status}`);
  }
};
