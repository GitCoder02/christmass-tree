import mongoose from 'mongoose';

const ornamentSchema = new mongoose.Schema({
  id: String,
  type: String,
  emoji: String,  // Added emoji field
  position: {
    x: Number,
    y: Number
  },
  rotation: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  addedBy: String
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  treeSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  ornaments: [ornamentSchema],
  activeUsers: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// FIXED: Remove next() - Modern Mongoose doesn't need it
sessionSchema.pre('save', function() {
  this.lastActivity = Date.now();
  // Don't call next() - just return or do nothing
});

export default mongoose.model('Session', sessionSchema);
