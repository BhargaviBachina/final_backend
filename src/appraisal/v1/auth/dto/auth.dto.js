const { body, validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(validation => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

exports.validateRegister = validate([
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phoneNumber').isMobilePhone().withMessage('Invalid phone number'),
  body('dob').isDate().withMessage('Invalid date of birth'),
]);

exports.validateLogin = validate([
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]);

exports.validateResetPassword = validate([
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]);
