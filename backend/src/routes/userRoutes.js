import express from 'express';
import { registerStudent, registerAlumni, loginUser, getUserProfile, updateProfile, getAllAlumni, getAlumniFilters } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';
import { 
    validateLogin, 
    validateStudentRegistration, 
    validateAlumniRegistration, 
    validateProfileUpdate,
    validateFileUpload 
} from '../middleware/validation.js';

const router = express.Router();

// Registration routes
router.post('/register/student', 
    upload.single('document'), 
    validateFileUpload, 
    validateStudentRegistration, 
    registerStudent
);

router.post('/register/alumni', 
    upload.single('document'), 
    validateFileUpload, 
    validateAlumniRegistration, 
    registerAlumni
);

// Authentication routes
router.post('/login', validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', 
    protect, 
    upload.single('profilePicture'), 
    validateProfileUpdate, 
    updateProfile
);

// Alumni routes
router.get('/alumni', protect, getAllAlumni);
router.get('/alumni/filters', protect, getAlumniFilters);
export default router;


