const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass || user.includes('your_email')) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendOtpEmail({ to, otp }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n==================================================`);
    console.log(`🔑 OTP FOR [${to}]: ${otp}`);
    console.log(`👉 To send real emails to your Gmail inbox, add EMAIL_USER and EMAIL_PASS (App Password) to .env`);
    console.log(`==================================================\n`);
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">College Event Planner</h2>
      <p style="color: #475569; font-size: 15px;">Your one-time verification code is:</p>
      <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This code will expire in 5 minutes. If you did not initiate this login, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"College Event Planner" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Your Login Verification Code: ${otp}`,
      html,
    });
    return { success: true, simulated: false };
  } catch (err) {
    console.error('Failed to send OTP email via Gmail SMTP:', err.message);
    console.log(`🔑 FALLBACK OTP FOR [${to}]: ${otp}`);
    return { success: true, simulated: true, error: err.message };
  }
}

module.exports = { sendOtpEmail };

