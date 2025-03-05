import express from 'express';
import { 
  getTopUsersByLikes, 
  getTopUsersBySaves, 
  getTopLikedSnippets, 
  getTopSavedSnippets,
  invalidateRankingsCache
} from '../controllers/rankings';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/users/likes', getTopUsersByLikes);
router.get('/users/saves', getTopUsersBySaves);
router.get('/snippets/likes', getTopLikedSnippets);
router.get('/snippets/saves', getTopSavedSnippets);

// Admin-only routes (requires authentication)
router.post('/invalidate-cache', protect, invalidateRankingsCache);

export default router; 