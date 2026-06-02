import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET all users (Requires requesterEmail in query string)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterEmail = searchParams.get('requesterEmail');

    if (!requesterEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const users = await User.find({}, '-otp -otpExpiresAt').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT to update user role/permissions
export async function PUT(request) {
  try {
    const { requesterEmail, targetUserId, newRole, newPermissions } = await request.json();

    if (!requesterEmail || !targetUserId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent stripping super_admin from ragulkannadasan@gmail.com
    if (targetUser.email === 'ragulkannadasan@gmail.com') {
       return NextResponse.json({ success: false, error: 'Cannot modify Super Admin' }, { status: 403 });
    }

    targetUser.role = newRole || targetUser.role;
    targetUser.permissions = newPermissions || targetUser.permissions;
    
    await targetUser.save();

    return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
