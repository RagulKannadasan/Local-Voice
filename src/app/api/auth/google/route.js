import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { OAuth2Client } from 'google-auth-library';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-google-client-id.apps.googleusercontent.com';
const client = new OAuth2Client(clientId);

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ success: false, error: 'Google credential missing' }, { status: 400 });
    }

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ success: false, error: 'Invalid Google token' }, { status: 400 });
    }

    const { email, name, picture } = payload;

    await connectToDatabase();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        email,
        name: name || 'Google User',
        profilePhoto: picture || '',
        role: 'user',
        permissions: []
      });
      await user.save();
    }

    // Super Admin auto-assignment
    if (user.email === 'ragulkannadasan@gmail.com' && user.role !== 'super_admin') {
      user.role = 'super_admin';
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Verified successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username || '',
        profilePhoto: user.profilePhoto || picture || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        permissions: user.permissions || [],
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying Google token:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify Google token' }, { status: 500 });
  }
}
