import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find user or create a new one
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, otp, otpExpiresAt });
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
    }
    await user.save();

    // Send email using NodeMailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Local Voice Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Login Code for Local Voice`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
          <h2 style="color: #2563eb;">Local Voice Login</h2>
          <p>Here is your 6-digit one-time password (OTP) to securely log in to your account. It will expire in 10 minutes.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b; margin: 0;">${otp}</p>
          </div>
          <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
