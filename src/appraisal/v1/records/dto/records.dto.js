const { body, query, validationResult } = require('express-validator');

// Middleware to validate the request and handle errors
const validate = (validations) => async (req, res, next) => {
  // Run all validations
  await Promise.all(validations.map((validation) => validation.run(req)));

  // Capture validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation for CSV upload
exports.validateCSVUpload = validate([
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('File is required');
    }
    return true;
  }),
]);

// Validation for fetching records
exports.validateFetchRecords = validate([
  query('sessionId').optional().isUUID().withMessage('Invalid sessionId format'),
  query('field').optional().isString().withMessage('Search field must be a string'),
  query('value').optional().isString().withMessage('Search value must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('perPage').optional().isInt({ min: 1 }).withMessage('PerPage must be a positive integer'),
]);
