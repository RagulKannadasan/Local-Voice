import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request) {
  try {
    const { email, name, phone, address, username } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return NextResponse.json({ success: false, error: 'Invalid username format' }, { status: 400 });
      }

      const existingUser = await User.findOne({ username: username.toLowerCase(), email: { $ne: email } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Username is already taken' }, { status: 400 });
      }
      targetUser.username = username.toLowerCase();
    }

    targetUser.name = name || targetUser.name;
    targetUser.phone = phone || targetUser.phone;
    targetUser.address = address || targetUser.address;

    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        username: targetUser.username,
        phone: targetUser.phone,
        address: targetUser.address,
        role: targetUser.role,
        permissions: targetUser.permissions,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
