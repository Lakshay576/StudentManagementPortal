import { body, validationResult } from 'express-validator';

export const createSchoolValidator = [
  body('name').notEmpty().withMessage('School name is required'),
  body('schoolCode').notEmpty().withMessage('School code is required').isString().withMessage('School code must be a string'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('email').notEmpty().withMessage('School email is required').isEmail().withMessage('Must be a valid email'),
  body('phone').notEmpty().withMessage('School phone number is required').isString().withMessage('Phone must be a string'),
  body('logo').optional().isString().withMessage('Logo must be a valid string URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    next();
  }
];

export const updateSchoolValidator = [
  body('name').optional().notEmpty().withMessage('School name cannot be empty'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('logo').optional().isString().withMessage('Logo must be a valid string URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    next();
  }
];
