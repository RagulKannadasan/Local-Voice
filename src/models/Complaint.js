import mongoose from 'mongoose';

const TimelineEventSchema = new mongoose.Schema({
  action: { type: String, required: true },
  author: { type: String, required: true }, // Name of user or admin
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  userUsername: { type: String, default: null },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  imageUrl: { type: String, default: null }, // Compressed Base64 string
  emailSent: { type: Boolean, default: false }, // Tracks if the 30min delayed email has been sent
  timeline: [TimelineEventSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ComplaintSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
