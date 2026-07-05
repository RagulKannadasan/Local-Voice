import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Poll from '@/models/Poll';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterEmail = searchParams.get('requesterEmail');
    const id = searchParams.get('id');

    await connectToDatabase();
    
    // Check if the requester is an admin
    let isAdmin = false;
    if (requesterEmail) {
      const user = await User.findOne({ email: requesterEmail });
      if (user && (user.role === 'super_admin' || (user.permissions || []).includes('manage_announcements'))) {
        isAdmin = true;
      }
    }

    let query = {};
    if (id) {
      query._id = id;
    } else {
      // For general feed, only fetch active polls
      query.isActive = true;
    }

    const polls = await Poll.find(query).sort({ createdAt: -1 });
    
    const formattedPolls = polls.map(poll => {
      return {
        id: poll._id.toString(),
        question: poll.question,
        options: poll.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes,
          // Only send the voters array if the user is an admin
          voters: isAdmin ? opt.voters : undefined
        })),
        totalVotes: poll.totalVotes,
        author: poll.author,
        // Only send the full votedUsers array to admins. For regular users, we keep it completely secret.
        votedUsers: isAdmin ? poll.votedUsers : undefined,
        // Calculate hasVoted on the backend to avoid exposing the votedUsers array to the frontend
        hasVoted: requesterEmail ? poll.votedUsers.includes(requesterEmail) : false,
        comments: poll.comments ? poll.comments.map(c => ({
          content: c.content,
          createdAt: c.createdAt,
          authorName: isAdmin ? c.authorName : undefined,
          authorEmail: isAdmin ? c.authorEmail : undefined
        })) : [],
        createdAt: poll.createdAt,
        isActive: poll.isActive
      };
    });
    
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
        votes: 0,
        voters: []
      })),
      totalVotes: 0,
      author: requester.name || requesterEmail,
      votedUsers: [],
      comments: []
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
    const { pollId, optionId, userEmail, userName, action, content } = data;

    if (!pollId) {
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

    if (action === 'comment') {
      if (!content || !content.trim()) {
        return NextResponse.json({ success: false, error: 'Empty comment' }, { status: 400 });
      }
      if (!poll.comments) poll.comments = [];
      const newComment = { 
        content: content.trim(),
        authorName: userName || 'Guest',
        authorEmail: userEmail || 'guest@localvoice.com'
      };
      poll.comments.push(newComment);
      await poll.save();
      
      // Don't leak the author info back to the client if they aren't admin (they just posted it though, but for safety)
      return NextResponse.json({ 
        success: true, 
        message: 'Comment added', 
        comment: { content: newComment.content, createdAt: new Date() }
      }, { status: 200 });
    }

    // Default: Vote action
    if (!optionId || !userEmail) {
      return NextResponse.json({ success: false, error: 'Missing required fields for voting' }, { status: 400 });
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

    // Format voter string for admin panel
    let voterStringToSave = userEmail;
    if (!userEmail.startsWith('GUEST::')) {
      const userDoc = await User.findOne({ email: userEmail });
      if (userDoc) {
        voterStringToSave = `USER::${userDoc.name || 'Local Voice User'}::${userEmail}`;
      }
    }

    option.votes += 1;
    if (!option.voters) option.voters = [];
    option.voters.push(voterStringToSave);
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

export async function PATCH(request) {
  try {
    const data = await request.json();
    const { pollId, requesterEmail, isActive } = data;

    if (!pollId || !requesterEmail || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || (requester.role !== 'super_admin' && !(requester.permissions || []).includes('manage_announcements'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const poll = await Poll.findByIdAndUpdate(pollId, { isActive }, { new: true });
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, isActive: poll.isActive }, { status: 200 });
  } catch (error) {
    console.error('Error toggling poll status:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
