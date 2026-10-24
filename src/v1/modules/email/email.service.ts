import { getTransporter, getEmailFrom, isEmailConfigured, getEmailUser } from "../../../config/email.config";

/**
 * Sends a 6-digit OTP verification email for account registration.
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  recipientName: string = "Traveler"
): Promise<{ success: boolean; messageId?: string }> => {
  // If credentials are not configured, print OTP to console for development ease
  if (!isEmailConfigured()) {
    console.log(`\n======================================================`);
    console.log(`📧 [DEV EMAIL SIMULATOR] Registration OTP`);
    console.log(`To: ${to} (${recipientName})`);
    console.log(`Your 6-Digit OTP: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`⚠️ EMAIL_USER or EMAIL_PASS not set in .env.`);
    console.log(`Please enter your Gmail and App Password in .env to send real emails.`);
    console.log(`======================================================\n`);
    return { success: true, messageId: "dev-simulated-id" };
  }

  const transporter = getTransporter();
  const from = getEmailFrom();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - StayUp Stays</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #0a2560 0%, #1444a8 100%);
          padding: 36px 30px;
          text-align: center;
          color: #ffffff;
        }
        .brand {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .brand span {
          color: #ff4b38;
        }
        .subtitle {
          font-size: 13px;
          color: #bfdbfe;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 36px 32px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        .text {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin: 16px 0;
        }
        .otp-box {
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin: 28px 0;
        }
        .otp-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .otp-code {
          font-size: 38px;
          font-weight: 900;
          letter-spacing: 8px;
          color: #0a2560;
          font-family: 'Courier New', Courier, monospace;
        }
        .expiry-note {
          font-size: 12px;
          color: #e52823;
          font-weight: 600;
          margin-top: 10px;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 32px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand">Stay<span>Up</span> Stays</h1>
          <p class="subtitle">Luxury Resorts & Unforgettable Escapes</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${recipientName}!</div>
          <p class="text">
            Thank you for choosing <strong>StayUp Stays</strong>. Please use the one-time verification code below to verify your email address and activate your account.
          </p>
          <div class="otp-box">
            <div class="otp-label">Your 6-Digit Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">⏱ This code expires in 10 minutes</div>
          </div>
          <p class="text">
            If you did not initiate this request, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} StayUp Stays. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Your StayUp Stays Verification Code: ${otp}`,
      text: `Hello ${recipientName},\n\nYour StayUp Stays verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nThank you for choosing StayUp Stays!`,
      html: htmlContent,
    });

    console.log(`[EmailService] Verification OTP successfully sent to ${to}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`\n❌ [EmailService] Failed to send email via Gmail (${getEmailUser()}):`, error.message);
    console.log(`📧 [FALLBACK OTP FOR TESTING]: ${otp} for ${to}\n`);
    throw new Error(
      `Email sending failed: ${error.message || "Please check EMAIL_USER and EMAIL_PASS App Password"}`
    );
  }
};
