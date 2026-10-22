import { body, validationResult } from 'express-validator';

export const createSchoolAdminValidator = [
  body('name').notEmpty().withMessage('Admin name is required'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('schoolId').notEmpty().withMessage('School ID is required').isMongoId().withMessage('Invalid School ID format'),
  body('phone').optional().isString().withMessage('Phone must be a string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    next();
  }
];

export const updateProfileValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isString().withMessage('Phone must be a valid string'),
  body('address').optional().isString().withMessage('Address must be a valid string'),
  body('profileImage').optional().isString().withMessage('Profile image must be a valid URL string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    next();
  }
];

export const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    next();
  }
];
