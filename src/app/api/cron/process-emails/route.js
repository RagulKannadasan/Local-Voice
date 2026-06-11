import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export async function GET(request) {
  try {
    // You could add an authorization header check here if you want to secure the cron endpoint.
    // For example: if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) return ...
    
    await connectToDatabase();

    // Calculate time threshold: 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find all complaints created before threshold that haven't had their email sent
    const pendingComplaints = await Complaint.find({
      emailSent: false,
      createdAt: { $lte: thirtyMinutesAgo }
    });

    if (pendingComplaints.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending emails to process.' }, { status: 200 });
    }

    // Fetch all users to send the community announcement
    const allUsers = await User.find({}, 'email');
    const allEmails = allUsers.map(u => u.email).filter(Boolean);

    if (allEmails.length === 0) {
      return NextResponse.json({ success: true, message: 'No users to notify.' }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let processedCount = 0;

    for (const complaint of pendingComplaints) {
      try {
        const mailOptions = {
          from: `"Local Voice Kavarappattu" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER, // Send to self
          bcc: allEmails.join(','), // BCC everyone
          subject: `New Community Alert: ${complaint.category} in ${complaint.location}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Complaint Posted in Kavarappattu</h2>
              <p>A new issue has been reported by a community member on Local Voice.</p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p><strong>Category:</strong> ${complaint.category}</p>
                <p><strong>Area:</strong> ${complaint.location}</p>
                <p><strong>Description:</strong> ${complaint.description}</p>
                <p><strong>Reported By:</strong> ${complaint.userName}</p>
              </div>
              <p>You can view the full details or check for updates on the Local Voice app.</p>
              <div style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://local-voice.vercel.app'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Local Voice App</a>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        
        // Mark as sent
        complaint.emailSent = true;
        await complaint.save();
        processedCount++;
        
      } catch (emailError) {
        console.error(`Failed to send email for complaint ${complaint._id}:`, emailError);
        // We do not set emailSent to true, so it will retry next time the cron runs.
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${processedCount} delayed complaint emails.` 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in cron process-emails:', error);
    return NextResponse.json({ success: false, error: 'Server error during cron execution' }, { status: 500 });
  }
}
