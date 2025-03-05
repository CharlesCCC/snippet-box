import express from 'express';
import { protect } from '../middleware/auth';
import {
  getComments,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/comments';

const router = express.Router({ mergeParams: true });

// Get comments for a snippet
router.route('/').get(getComments);

// Add a comment (requires authentication)
router.route('/').post(protect, addComment);

// Update and delete comments (requires authentication)
router.route('/:id').put(protect, updateComment);
router.route('/:id').delete(protect, deleteComment);

export default router; 