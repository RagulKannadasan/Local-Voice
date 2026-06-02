import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Normal', 'High'],
    default: 'Normal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
