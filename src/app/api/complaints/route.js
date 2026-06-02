import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import User from '@/models/User';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const all = searchParams.get('all');
    const publicView = searchParams.get('public');

    if (!userEmail && publicView !== 'true') {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    await connectToDatabase();

    if (publicView === 'true') {
      const complaints = await Complaint.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, complaints }, { status: 200 });
    } else if (all === 'true') {
      // Check if user is admin
      const requester = await User.findOne({ email: userEmail });
      if (!requester || (requester.role !== 'super_admin' && !requester.permissions.includes('manage_complaints'))) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      const complaints = await Complaint.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, complaints }, { status: 200 });
    } else {
      // Fetch only user's complaints
      const complaints = await Complaint.find({ userEmail }).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, complaints }, { status: 200 });
    }

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { title, description, category, location, userEmail, userName, userUsername, imageUrl } = data;

    if (!title || !description || !category || !location || !userEmail || !userName) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const newComplaint = await Complaint.create({
      title,
      description,
      category,
      location,
      userEmail,
      userName,
      userUsername: userUsername || null,
      imageUrl: imageUrl || null,
      timeline: [{
        action: 'Complaint Submitted',
        author: userName,
      }]
    });

    return NextResponse.json({ success: true, complaint: newComplaint }, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { complaintId, status, timelineUpdate, requesterEmail, requesterName } = data;

    if (!complaintId || !requesterEmail) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || (requester.role !== 'super_admin' && !requester.permissions.includes('manage_complaints'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    if (status) complaint.status = status;
    
    if (timelineUpdate) {
      complaint.timeline.push({
        action: timelineUpdate,
        author: requesterName || requester.name,
        timestamp: new Date()
      });
    }

    await complaint.save();

    return NextResponse.json({ success: true, complaint }, { status: 200 });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
