import { Router } from 'express';
import {
  saveSnippet,
  unsaveSnippet,
  getSavedSnippets,
  checkSavedSnippet
} from '../controllers/saved';
import { protect } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.route('/').get(getSavedSnippets).post(saveSnippet);
router.route('/:id').delete(unsaveSnippet);
router.route('/check/:id').get(checkSavedSnippet);

export default router; 