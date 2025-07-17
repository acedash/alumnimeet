import express from 'express';
import { registerStudent, registerAlumni, loginUser, getUserProfile,updateProfile, getAllAlumni, getAlumniFilters } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/uploadMiddleware.js';


const router = express.Router();

// Registration routes
router.post('/register/student', upload.single('document'), registerStudent);
router.post('/register/alumni', upload.single('document'), registerAlumni);

// Authentication routes
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile',protect,upload.single('profilePicture'),updateProfile)
router.get('/alumni', protect, getAllAlumni);
router.get('/alumni/filters', protect, getAlumniFilters);
export default router;


