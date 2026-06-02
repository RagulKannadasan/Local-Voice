import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, announcements }, { status: 200 });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content, priority, requesterEmail } = await request.json();

    if (!requesterEmail || !title || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || (requester.role !== 'super_admin' && !requester.permissions.includes('manage_announcements'))) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const newAnnouncement = await Announcement.create({
      title,
      content,
      priority: priority || 'Normal',
      author: requester.name,
    });

    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const requesterEmail = searchParams.get('requesterEmail');

    if (!id || !requesterEmail) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
