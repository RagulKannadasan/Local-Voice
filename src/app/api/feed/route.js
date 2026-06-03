import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, posts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { authorName, authorEmail, authorUsername, authorAvatar, content, imageUrl } = data;

    if (!authorName || !authorEmail || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const newPost = await Post.create({
      authorName,
      authorEmail,
      authorUsername: authorUsername || null,
      authorAvatar: authorAvatar || '/avatars/default.jpg',
      content,
      imageUrl: imageUrl || null,
      likes: [],
      comments: [],
      shares: 0,
    });

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { postId, userEmail, userName, action, content } = await request.json();

    if (!postId || !action) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (action === 'like') {
      if (!userEmail) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
      const hasLiked = post.likes.includes(userEmail);
      if (hasLiked) {
        post.likes = post.likes.filter(email => email !== userEmail);
      } else {
        post.likes.push(userEmail);
      }
    } else if (action === 'share') {
      post.shares += 1;
    } else if (action === 'comment') {
      if (!userEmail || !userName || !content) {
        return NextResponse.json({ success: false, error: 'Missing comment details' }, { status: 400 });
      }
      post.comments.push({
        authorName: userName,
        authorEmail: userEmail,
        content: content
      });
    }

    await post.save();
    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const requesterEmail = searchParams.get('requesterEmail');

    if (!postId || !requesterEmail) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || requester.role !== 'super_admin') {
       return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
