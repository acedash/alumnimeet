import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['normal', 'event', 'job'],
    required: true,
    default: 'normal'
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  // Fields specific to event posts
  eventDetails: {
    title: {
      type: String,
      required: function() { return this.type === 'event'; }
    },
    date: {
      type: Date,
      required: function() { return this.type === 'event'; }
    },
    location: {
      type: String,
      required: function() { return this.type === 'event'; }
    },
    registrationLink: String
  },
  // Fields specific to job posts
  jobDetails: {
    company: {
      type: String,
      required: function() { return this.type === 'job'; }
    },
    position: {
      type: String,
      required: function() { return this.type === 'job'; }
    },
    applyBy: Date,
    applicationLink: String,
    salary: String,
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract']
    }
  },
  attachments: [String], // URLs to attached files/images
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ isActive: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
