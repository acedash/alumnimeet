import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAllAlumni,
  getAlumniFilters,
  getAlumniProfile,
  searchAlumni,
  getSimilarAlumni
} from '../controllers/alumniController.js';

const router = express.Router();

router.get('/', protect, getAllAlumni);
router.get('/filters', protect, getAlumniFilters);
router.get('/search', protect, searchAlumni);
router.get('/:id', protect, getAlumniProfile);
router.get('/:id/similar', protect, getSimilarAlumni);

export default router;