const nodemailer = require('nodemailer');

// ─── SMTP Transporter (Local Dev fallback) ─────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

// ─── Generate a 6-digit OTP ────────────────────────────────────────────────────
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP Email ────────────────────────────────────────────────────────────
const sendOTPEmail = async (toEmail, otp, recipientName = 'Valued User') => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#12121E;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 20px;margin-bottom:16px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-1px;font-style:italic;text-transform:uppercase;">
                  KASHMIR<span style="color:#FCD34D;">MOVE</span>
                </span>
              </div>
              <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                Email Verification
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#94A3B8;font-size:15px;margin:0 0 8px 0;">Hello, <strong style="color:#fff;">${recipientName}</strong></p>
              <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 32px 0;">
                Use the verification code below to complete your KashmirMove registration. This code expires in <strong style="color:#F59E0B;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#0A0A0F;border:2px solid #DC2626;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
                <div style="color:#64748B;font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">
                  Verification Code
                </div>
                <div style="color:#fff;font-size:42px;font-weight:900;letter-spacing:16px;font-family:monospace;text-shadow:0 0 20px rgba(220,38,38,0.4);">
                  ${otp}
                </div>
              </div>

              <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                If you did not request this code, you can safely ignore this email.<br>
                Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#334155;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">
                © 2026 KASHMIRMOVE · Crafted by Shahid Dar
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. In Production (Railway): Use Brevo HTTPS API (standard port 443, never blocked)
    // Allows sending to ANY recipient in the world from verified Gmail without a custom domain!
    if (process.env.BREVO_API_KEY) {
        console.log(`[MAILER] Sending email to ${toEmail} using Brevo HTTPS API...`);
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: "KashmirMove",
                        email: "kashmirmove.app@gmail.com"
                    },
                    to: [
                        {
                            email: toEmail,
                            name: recipientName
                        }
                    ],
                    subject: 'Your KashmirMove Verification Code',
                    htmlContent: htmlContent
                })
            });

            const resData = await response.json();
            if (!response.ok) {
                throw new Error(resData.message || 'Unknown Brevo API error');
            }
            console.log(`[MAILER] Email successfully sent to ${toEmail} via Brevo HTTP API. ID: ${resData.messageId}`);
            return;
        } catch (error) {
            console.error('[MAILER] Brevo API Error:', error.message);
            throw new Error(`Email delivery failed via Brevo HTTP API: ${error.message}`);
        }
    }

    // 2. Local Dev: Use standard Gmail SMTP (Nodemailer)
    console.log(`[MAILER] Sending email to ${toEmail} using Gmail SMTP (Local Dev)...`);
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('SMTP credentials are missing. Please add EMAIL_USER and EMAIL_PASS environment variables.');
    }

    const mailOptions = {
        from: `"KashmirMove" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Your KashmirMove Verification Code',
        html: htmlContent
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };
