import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/undefined values to exist
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    default: 'Local Voice User',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user',
  },
  permissions: {
    type: [String],
    default: [], // e.g. ['manage_complaints', 'manage_polls']
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
