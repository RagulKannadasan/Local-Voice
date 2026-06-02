import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const excludeEmail = searchParams.get('excludeEmail');

    if (!username) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
    }

    // Basic validation: alphanumeric and underscores only, length 3-20
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Must be 3-20 characters, containing only letters, numbers, or underscores' 
      });
    }

    await connectToDatabase();

    const query = { username: username.toLowerCase() };
    if (excludeEmail) {
      query.email = { $ne: excludeEmail };
    }

    const existingUser = await User.findOne(query);

    if (existingUser) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}
