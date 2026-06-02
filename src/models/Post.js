import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const PostSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorUsername: { type: String, default: null },
  authorAvatar: { type: String, default: '/avatars/default.jpg' },
  content: { type: String, required: true },
  imageUrl: { type: String, default: null }, // Compressed Base64 string
  likes: [{ type: String }], // Array of user emails who liked
  comments: [CommentSchema],
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
