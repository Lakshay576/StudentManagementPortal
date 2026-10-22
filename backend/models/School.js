import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  schoolCode: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  logo: {
    type: String,
  },
  website: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Reverse populate with virtuals to get admins for each school
schoolSchema.virtual('admins', {
  ref: 'User',
  localField: '_id',
  foreignField: 'schoolId',
  match: { role: 'SchoolAdmin' }
});

// Ensure virtuals are included when converted to JSON
schoolSchema.set('toJSON', { virtuals: true });
schoolSchema.set('toObject', { virtuals: true });

export default mongoose.model('School', schoolSchema);
