import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import School from '../models/School.js';
import { removeFile } from '../utils/Storage.js';

// runs the rules; deletes the already-uploaded file when validation fails
const handleResult = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  if (req.file) await removeFile(`videos/${req.file.filename}`);

  const messages = errors.array().map((e) => e.msg);
  return res.status(400).json({ success: false, message: messages[0], errors: messages });
};

const fileRequired = (req, res, next) => {
  if (req.file) return next();
  return res.status(400).json({ success: false, message: 'Video file is required' });
};

// the school must be a valid id and exist
const schoolExists = async (value) => {
  if (!mongoose.isValidObjectId(value)) throw new Error('Invalid school id');
  if (!(await School.exists({ _id: value }))) throw new Error('School not found');
  return true;
};

// ---------- shared field rules ----------
const titleRule = (required) => {
  const rule = required
    ? body('title').trim().notEmpty().withMessage('Title is required')
    : body('title').optional().trim().notEmpty().withMessage('Title cannot be empty');
  return rule.isLength({ max: 150 }).withMessage('Title must be at most 150 characters');
};

const commonRules = [
  body('description').optional({ values: 'falsy' }).trim()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
  body('category').optional({ values: 'falsy' }).trim()
    .isLength({ max: 50 }).withMessage('Category must be at most 50 characters'),
  body('status').optional({ values: 'falsy' })
    .isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),
];

const durationRule = body('duration').optional({ values: 'falsy' })
  .isFloat({ min: 0 }).withMessage('Duration must be a positive number');

// ---------- Super Admin ----------
export const uploadVideoValidator = [
  fileRequired,
  titleRule(true),
  ...commonRules,
  durationRule,
  body('schoolId').notEmpty().withMessage('School is required').bail().custom(schoolExists),
  handleResult,
];

export const updateVideoValidator = [
  titleRule(false),
  ...commonRules,
  body('schoolId').optional().custom(schoolExists), // moves the video to another school
  handleResult,
];

// ---------- School Admin (schoolId comes from the account, never the body) ----------
export const uploadSchoolVideoValidator = [
  fileRequired,
  titleRule(true),
  ...commonRules,
  durationRule,
  handleResult,
];

export const updateSchoolVideoValidator = [
  titleRule(false),
  ...commonRules,
  handleResult,
];