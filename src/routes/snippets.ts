import { Router } from 'express';
import {
  countTags,
  createSnippet,
  deleteSnippet,
  getAllSnippets,
  getRawCode,
  getSnippet,
  searchSnippets,
  updateSnippet
} from '../controllers/snippets';
import { requireBody } from '../middleware';
import { protect } from '../middleware/auth';

export const snippetRouter = Router();

// Public routes - accessible without authentication
snippetRouter.route('/').get(getAllSnippets);
snippetRouter.route('/:id').get(getSnippet);
snippetRouter.route('/statistics/count').get(countTags);
snippetRouter.route('/raw/:id').get(getRawCode);
snippetRouter.route('/search').post(searchSnippets);

// Protected routes - require authentication
snippetRouter
  .route('/')
  .post(protect, requireBody('title', 'language', 'code'), createSnippet);

snippetRouter
  .route('/:id')
  .put(protect, updateSnippet)
  .delete(protect, deleteSnippet);