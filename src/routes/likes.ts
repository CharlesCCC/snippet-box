import { Router } from 'express';
import { likeSnippet, unlikeSnippet, checkLiked } from '../controllers/likes';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
// router.use(protect);

// Routes
router.route('/:id').post(protect,likeSnippet).delete(protect,unlikeSnippet);
router.route('/check/:id').get(checkLiked);

export default router; 