import { body, validationResult } from 'express-validator';

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, message: messages[0], errors: messages });
  }
  next();
};

export const createStudentValidator = [
  body('name').trim().notEmpty().withMessage('Student name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ values: 'falsy' }).trim().isString().withMessage('Phone must be a string'),

  body('admissionNumber').trim().notEmpty().withMessage('Admission number is required'),
  body('rollNumber').optional({ values: 'falsy' }).trim().isString(),
  body('className').trim().notEmpty().withMessage('Class is required'),
  body('section').optional({ values: 'falsy' }).trim().isString(),
  body('academicYear').optional({ values: 'falsy' }).trim().isString(),
  body('admissionDate').optional({ values: 'falsy' }).isISO8601().withMessage('Admission date must be a valid date'),

  body('dob').optional({ values: 'falsy' }).isISO8601().withMessage('Date of birth must be a valid date'),
  body('gender').optional({ values: 'falsy' }).isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female or Other'),
  body('address').optional({ values: 'falsy' }).trim().isString(),

  body('guardian.name').optional({ values: 'falsy' }).trim().isString(),
  body('guardian.relation').optional({ values: 'falsy' }).trim().isString(),
  body('guardian.phone').optional({ values: 'falsy' }).trim().isString(),
  body('guardian.email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Guardian email must be valid'),

  handleErrors,
];

export const updateStudentValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email').optional().trim().isEmail().withMessage('Must be a valid email'),
  body('phone').optional().trim().isString().withMessage('Phone must be a string'),

  body('admissionNumber').optional().trim().notEmpty().withMessage('Admission number cannot be empty'),
  body('rollNumber').optional().trim().isString(),
  body('className').optional().trim().notEmpty().withMessage('Class cannot be empty'),
  body('section').optional().trim().isString(),
  body('academicYear').optional().trim().isString(),
  body('admissionDate').optional({ values: 'falsy' }).isISO8601().withMessage('Admission date must be a valid date'),
  body('status').optional().isIn(['Active', 'Inactive', 'Graduated', 'Transferred'])
    .withMessage('Status must be Active, Inactive, Graduated or Transferred'),

  body('dob').optional({ values: 'falsy' }).isISO8601().withMessage('Date of birth must be a valid date'),
  body('gender').optional({ values: 'falsy' }).isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female or Other'),
  body('address').optional().trim().isString(),

  body('guardian.name').optional().trim().isString(),
  body('guardian.relation').optional().trim().isString(),
  body('guardian.phone').optional().trim().isString(),
  body('guardian.email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Guardian email must be valid'),

  handleErrors,
];