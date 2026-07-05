import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Using string ID for simpler frontend integration (e.g. "1", "2")
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: [{ type: String }], // Array of user emails who voted for this option
}, { _id: false });

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [OptionSchema],
  defaultLanguage: { type: String, enum: ['en', 'ta'], required: true, default: 'en' },
  totalVotes: { type: Number, default: 0 },
  author: { type: String, required: true }, // Name/Email of the admin who created it
  isActive: { type: Boolean, default: true },
  votedUsers: [{ type: String }], // Array of user emails who have voted
  comments: [{
    content: { type: String, required: true },
    authorName: { type: String },
    authorEmail: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Poll || mongoose.model('Poll', PollSchema);
