import { Router } from 'express';
import { likeSnippet, unlikeSnippet, checkLiked, batchCheckLiked } from '../controllers/likes';
import { protect, optionalProtect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
// router.use(protect);

// Routes
router.route('/:id').post(protect,likeSnippet).delete(protect,unlikeSnippet);
router.route('/check/:id').get(optionalProtect, checkLiked);
router.route('/check-batch').post(optionalProtect, batchCheckLiked);

export default router; 