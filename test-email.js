import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'freeuseshared@gmail.com',
    pass: 'erau nmfo qscm tsko'
  }
});

const mailOptions = {
  from: '"Local Voice Kavarappattu" <freeuseshared@gmail.com>',
  to: 'ragulkavai@gmail.com',
  subject: 'Test Email from Local Voice',
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Test Email Successful!</h2>
      <p>Hello,</p>
      <p>This is a test email sent from your development environment to verify that the email configuration is working correctly.</p>
      <p>The fallback domain is now updated to: <b>https://local-voice-codelab.vercel.app/</b></p>
    </div>
  `
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent successfully!', info.response);
  }
});
