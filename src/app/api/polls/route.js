import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Poll from '@/models/Poll';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    // Fetch all active polls, sorted by newest first
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Transform to match the frontend expected structure (id vs _id)
    const formattedPolls = polls.map(poll => ({
      id: poll._id.toString(),
      question: poll.question,
      options: poll.options,
      totalVotes: poll.totalVotes,
      author: poll.author,
      votedUsers: poll.votedUsers,
      createdAt: poll.createdAt
    }));
    
    return NextResponse.json({ success: true, polls: formattedPolls }, { status: 200 });
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { requesterEmail, question, options } = data;

    if (!requesterEmail || !question || !options || options.length < 2) {
      return NextResponse.json({ success: false, error: 'Missing required fields or insufficient options' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify admin permission
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || (requester.role !== 'super_admin' && !(requester.permissions || []).includes('manage_announcements'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const newPoll = await Poll.create({
      question,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: 0
      })),
      totalVotes: 0,
      author: requester.name || requesterEmail,
      votedUsers: []
    });

    const formattedPoll = {
      id: newPoll._id.toString(),
      question: newPoll.question,
      options: newPoll.options,
      totalVotes: newPoll.totalVotes,
      author: newPoll.author,
      votedUsers: newPoll.votedUsers,
      createdAt: newPoll.createdAt
    };

    return NextResponse.json({ success: true, poll: formattedPoll }, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { pollId, optionId, userEmail } = data;

    if (!pollId || !optionId || !userEmail) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }
    
    if (!poll.isActive) {
      return NextResponse.json({ success: false, error: 'Poll is closed' }, { status: 400 });
    }

    // Check if user already voted
    if (poll.votedUsers.includes(userEmail)) {
      return NextResponse.json({ success: false, error: 'User has already voted' }, { status: 400 });
    }

    // Find option and increment vote
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return NextResponse.json({ success: false, error: 'Option not found' }, { status: 404 });
    }

    option.votes += 1;
    poll.totalVotes += 1;
    poll.votedUsers.push(userEmail);

    poll.markModified('options');
    await poll.save();

    return NextResponse.json({ success: true, message: 'Vote recorded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error voting in poll:', error);
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

    const poll = await Poll.findByIdAndDelete(id);
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Poll deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
