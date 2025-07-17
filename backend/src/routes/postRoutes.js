import express from "express"
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
  getPostsByType
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/type/:type', getPostsByType);
router.get('/:id', getPostById);
router.get('/user/:userId', getUserPosts);

// Protected routes (require authentication)
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

export default router;