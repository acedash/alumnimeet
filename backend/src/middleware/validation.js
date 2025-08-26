import { body, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Login validation
export const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

// Student registration validation
export const validateStudentRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z][a-zA-Z0-9 ]*$/)
        .withMessage('Name must start with a letter and can only contain letters, numbers, and spaces'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('currentYear')
        .isInt({ min: 1, max: 4 })
        .withMessage('Current year must be between 1 and 4'),
    body('department')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters')
        .matches(/^[a-zA-Z &-]+$/)
        .withMessage('Department can only contain letters, spaces, ampersands, and hyphens'),
    handleValidationErrors
];

// Alumni registration validation
export const validateAlumniRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z][a-zA-Z0-9 ]*$/)
        .withMessage('Name must start with a letter and can only contain letters, numbers, and spaces'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('graduationYear')
        .isInt({ min: 1980, max: new Date().getFullYear() })
        .withMessage(`Graduation year must be between 1980 and ${new Date().getFullYear()}`),
    body('department')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters')
        .matches(/^[a-zA-Z &-]+$/)
        .withMessage('Department can only contain letters, spaces, ampersands, and hyphens'),
    body('currentJob')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Current job must be between 2 and 200 characters')
        .matches(/^[a-zA-Z0-9\s,.'&-]+$/)
        .withMessage('Current job can contain letters, numbers, spaces, commas, periods, apostrophes, ampersands, and hyphens'),
    handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z][a-zA-Z0-9 ]*$/)
        .withMessage('Name must start with a letter and can only contain letters, numbers, and spaces'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .matches(/^[a-zA-Z0-9\s,.'&-]+$/)
        .withMessage('Location must not exceed 100 characters and can contain letters, numbers, spaces, commas, periods, apostrophes, ampersands, and hyphens'),
    body('currentJob')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .matches(/^[a-zA-Z0-9\s,.'&-]+$/)
        .withMessage('Current job must not exceed 200 characters and can contain letters, numbers, spaces, commas, periods, apostrophes, ampersands, and hyphens'),
    body('socialLinks.linkedin')
        .optional()
        .isURL()
        .withMessage('LinkedIn must be a valid URL'),
    body('socialLinks.twitter')
        .optional()
        .isURL()
        .withMessage('Twitter must be a valid URL'),
    body('socialLinks.personalWebsite')
        .optional()
        .isURL()
        .withMessage('Personal website must be a valid URL'),
    handleValidationErrors
];

// File validation helper
export const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Verification document is required'
        });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Only JPEG, PNG, and PDF files are allowed'
        });
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: 'File size must not exceed 5MB'
        });
    }

    next();
};
