import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // login account (name, email, password, phone, profileImage live here)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

  name: { type: String, required: true, trim: true, index: true },
  
  // academic
  admissionNumber: { type: String, required: true, trim: true },
  rollNumber: { type: String, trim: true, default: '' },
  className: { type: String, required: true, trim: true },   // e.g. "10"
  section: { type: String, trim: true, default: '' },        // e.g. "A"
  academicYear: { type: String, trim: true, default: '' },   // e.g. "2026-27"
  admissionDate: { type: Date, default: Date.now },

  // personal
  dob: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String, trim: true, default: '' },

  // guardian
  guardian: {
    name: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' },     // Father, Mother, ...
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },

  // enrollment status (login access is controlled by User.status)
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated', 'Transferred'], default: 'Active' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // the school admin
  createdAt: { type: Date, default: Date.now },
});

// admission number is unique inside a school, not globally
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
// common list filters
studentSchema.index({ schoolId: 1, className: 1, section: 1 });
studentSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Student', studentSchema);