import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import {
    getPendingVerifications,
    verifyUser,
    getAllUsers,
    getVerificationStats
} from '../controllers/adminController.js';

const router = express.Router();

// All routes are protected and require admin privileges
router.use(protect);
router.use(isAdmin);

// Get all pending verifications
router.get('/pending', getPendingVerifications);

// Verify a user
router.post('/verify', verifyUser);

// Get all users
router.get('/users', getAllUsers);

// Get verification statistics
router.get('/stats', getVerificationStats);

export default router; 