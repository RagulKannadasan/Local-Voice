import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, category, area, description, status, userEmail } = body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let mailOptions = {
      from: `"Local Voice Admin" <${process.env.SMTP_USER}>`,
    };

    if (type === 'NEW_COMPLAINT') {
      mailOptions.to = userEmail || process.env.SMTP_USER; // Send confirmation to user
      mailOptions.subject = `Confirmation: Your Complaint about ${category} in ${area}`;
      mailOptions.html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">We received your complaint!</h2>
          <p>Thank you for submitting a report to Local Voice. Our admins have been notified.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Area:</strong> ${area}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Current Status:</strong> <span style="color: #d97706; font-weight: bold;">Pending</span></p>
          </div>
          <p>We will email you again when the status changes.</p>
        </div>
      `;
    } else if (type === 'TEST_EMAIL') {
      mailOptions.to = userEmail || process.env.SMTP_USER;
      mailOptions.subject = `Test Email from Local Voice`;
      mailOptions.html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email Successful!</h2>
          <p>Hello,</p>
          <p>This is a test email sent from your development environment to verify that the email configuration is working correctly.</p>
          <p>The fallback domain is now updated to: <b>https://local-voice-codelab.vercel.app/</b></p>
        </div>
      `;
    } else if (type === 'STATUS_UPDATE') {
      mailOptions.to = userEmail || process.env.SMTP_USER;
      mailOptions.subject = `Update: Your Complaint in ${area} is now ${status}`;

      const statusColor = status === 'Resolved' ? '#16a34a' : '#2563eb';

      mailOptions.html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Complaint Status Updated</h2>
          <p>The status of your complaint regarding <strong>${category}</strong> in <strong>${area}</strong> has been updated by the Local Voice administration.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid ${statusColor};">
            <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold; font-size: 18px;">${status}</span></p>
            <p><strong>Original Description:</strong> ${description}</p>
          </div>
          <p>Thank you for helping keep Kavarappattu a better place!</p>
        </div>
      `;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
