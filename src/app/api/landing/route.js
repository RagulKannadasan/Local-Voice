import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Complaint from '@/models/Complaint';
import Poll from '@/models/Poll';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const [
      residentsCount,
      totalPosts,
      totalComplaints,
      resolvedComplaints,
      totalPolls,
      recentPosts,
      recentComplaints,
      activePoll
    ] = await Promise.all([
      User.countDocuments({}),
      Post.countDocuments({}),
      Complaint.countDocuments({}),
      Complaint.countDocuments({ status: 'Resolved' }),
      Poll.countDocuments({}),
      Post.find({}).sort({ createdAt: -1 }).limit(3).lean(),
      Complaint.find({}).sort({ createdAt: -1 }).limit(3).lean(),
      Poll.findOne({ isActive: true }).sort({ createdAt: -1 }).lean()
    ]);

    // Calculate resolution rate (percentage)
    const resolutionRate = totalComplaints > 0
      ? Math.round((resolvedComplaints / totalComplaints) * 100)
      : 100;

    let totalVotes = 0;
    if (activePoll && typeof activePoll.totalVotes === 'number') {
      totalVotes = activePoll.totalVotes;
    }

    return NextResponse.json({
      success: true,
      stats: {
        residentsCount,
        totalPosts,
        totalComplaints,
        resolvedComplaints,
        resolutionRate,
        totalPolls,
        totalVotes
      },
      recentPosts: (recentPosts || []).map(p => ({
        _id: p._id.toString(),
        author: p.authorName || 'Kavarappattu Resident',
        username: p.authorUsername || null,
        avatar: p.authorAvatar || null,
        content: p.content,
        imageUrl: p.imageUrl || null,
        likesCount: (p.likes || []).length,
        commentsCount: (p.comments || []).length,
        createdAt: p.createdAt
      })),
      recentComplaints: (recentComplaints || []).map(c => ({
        _id: c._id.toString(),
        title: c.title,
        description: c.description,
        category: c.category,
        location: c.location,
        status: c.status,
        userName: c.userName,
        createdAt: c.createdAt
      })),
      activePoll: activePoll ? {
        _id: activePoll._id.toString(),
        question: activePoll.question,
        options: (activePoll.options || []).map(o => ({
          id: o.id,
          text: o.text,
          votes: o.votes
        })),
        totalVotes: activePoll.totalVotes,
        createdAt: activePoll.createdAt
      } : null
    }, { status: 200 });
  } catch (error) {
    console.error('Landing API error:', error);
    return NextResponse.json({ success: false, error: 'Database connection error' }, { status: 500 });
  }
}
