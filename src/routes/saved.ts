import { Router } from 'express';
import {
  saveSnippet,
  unsaveSnippet,
  getSavedSnippets,
  checkSavedSnippet
} from '../controllers/saved';
import { protect, optionalProtect } from '../middleware/auth';

const router = Router();

// Routes that require authentication
router.route('/').get(protect, getSavedSnippets).post(protect, saveSnippet);
router.route('/:id').delete(protect, unsaveSnippet);

// Route that can work with or without authentication
router.route('/check/:id').get(optionalProtect, checkSavedSnippet);

export default router; 