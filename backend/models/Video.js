import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, default: '' },

  // storage: keep the key, never a full URL
  storageKey: { type: String, required: true },
  storageDriver: { type: String, enum: ['local', 'cdn'], default: 'local' },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },   // bytes
  duration: { type: Number, default: 0 },   // seconds
  thumbnailKey: { type: String, default: '' },

  // who can see it (used by School Admin / Student modules later)
  // visibility: { type: String, enum: ['All', 'Selected'], default: 'All' },
  // schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],

  // every video belongs to exactly one school
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaderRole: { type: String, enum: ['SuperAdmin', 'SchoolAdmin'], default: 'SuperAdmin' },

  createdAt: { type: Date, default: Date.now },
});

// text search + common filters
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

// URL is built from the key, so moving to a CDN is only an env change
videoSchema.virtual('url').get(function () {
  return `${process.env.MEDIA_BASE_URL}/${this.storageKey}`;
});
videoSchema.virtual('thumbnail').get(function () {
  return this.thumbnailKey ? `${process.env.MEDIA_BASE_URL}/${this.thumbnailKey}` : '';
});

videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Video', videoSchema);