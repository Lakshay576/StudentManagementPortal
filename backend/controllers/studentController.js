import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const USER_FIELDS = 'email phone profileImage status';

export const createStudent = async (req, res) => {
  let user = null;
  try {
    const schoolId = req.user.schoolId; // never taken from the request body
    if (!schoolId) {
      return res.status(403).json({ success: false, message: 'No school linked to this account' });
    }

    const {
      name, email, password, phone, admissionNumber, rollNumber, className, section,
      academicYear, admissionDate, dob, gender, address, guardian,
    } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    if (await Student.findOne({ schoolId, admissionNumber })) {
      return res.status(400).json({ success: false, message: 'A student with this admission number already exists' });
    }

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));

    user = await User.create({ name, email, password: hashed, role: 'Student', schoolId, phone });

    const student = await Student.create({
      userId: user._id,
      schoolId,
      name,
      admissionNumber,
      rollNumber,
      className,
      section,
      academicYear,
      admissionDate: admissionDate || undefined,
      dob: dob || undefined,
      gender: gender || undefined,
      address,
      guardian,
      createdBy: req.user._id,
    });

    await student.populate('userId', USER_FIELDS);

    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    if (user) await User.findByIdAndDelete(user._id); // rollback the login account
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate email or admission number' });
    }
    console.error('Create Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStudents = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(403).json({ success: false, message: 'No school linked to this account' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const { search, className, section, status } = req.query;

    const filter = { schoolId };

    if (search?.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      filter.$or = [{ name: rx }, { admissionNumber: rx }, { rollNumber: rx }];
    }
    if (className && className !== 'All') filter.className = className;
    if (section && section !== 'All') filter.section = section;
    if (status && status !== 'All') filter.status = status;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('userId', USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const pagination = {};
    if (page * limit < total) pagination.next = { page: page + 1, limit };
    if (page > 1) pagination.prev = { page: page - 1, limit };

    res.status(200).json({ success: true, count: students.length, total, pagination, data: students });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const FULL_USER_FIELDS = 'name email phone profileImage status role createdAt';

// finds a student inside the logged-in admin's school only
const findOwnStudent = (id, schoolId) =>
  mongoose.isValidObjectId(id) ? Student.findOne({ _id: id, schoolId }) : null;

export const getStudent = async (req, res) => {
  try {
    const student = await findOwnStudent(req.params.id, req.user.schoolId)
      ?.populate('userId', FULL_USER_FIELDS)
      .populate('schoolId', 'name schoolCode email');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Get Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const student = await findOwnStudent(req.params.id, schoolId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { name, email, phone, guardian, ...rest } = req.body;

    // admission number must stay unique inside the school
    if (rest.admissionNumber && rest.admissionNumber !== student.admissionNumber) {
      const dup = await Student.findOne({ schoolId, admissionNumber: rest.admissionNumber, _id: { $ne: student._id } });
      if (dup) {
        return res.status(400).json({ success: false, message: 'A student with this admission number already exists' });
      }
    }

    // login account fields
    const userUpdate = {};
    if (name !== undefined) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (email !== undefined) {
      const taken = await User.findOne({ email, _id: { $ne: student.userId } });
      if (taken) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      userUpdate.email = email;
    }

    // student profile fields (only allowed keys, schoolId/userId can never change)
    const ALLOWED = ['admissionNumber', 'rollNumber', 'className', 'section', 'academicYear',
      'admissionDate', 'dob', 'gender', 'address', 'status'];
    ALLOWED.forEach((k) => { if (rest[k] !== undefined) student[k] = rest[k] === '' ? undefined : rest[k]; });
    if (name !== undefined) student.name = name; // keep both copies in sync
    if (guardian) student.guardian = { ...student.guardian?.toObject?.(), ...guardian };

    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(student.userId, userUpdate, { runValidators: true });
    }
    await student.save();
    await student.populate('userId', FULL_USER_FIELDS);

    res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate email or admission number' });
    }
    console.error('Update Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await findOwnStudent(req.params.id, req.user.schoolId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Student.findByIdAndDelete(student._id);
    await User.findByIdAndDelete(student.userId); // remove the login account too

    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};