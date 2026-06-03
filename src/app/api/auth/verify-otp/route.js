import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }

    // Super Admin auto-assignment
    if (user.email === 'ragulkannadasan@gmail.com' && user.role !== 'super_admin') {
      user.role = 'super_admin';
    }

    // Clear the OTP
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Verified successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        permissions: user.permissions,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify OTP' }, { status: 500 });
  }
}
