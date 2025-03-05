import { Router } from "express";
import {
  countTags,
  countPublicTags,
  createSnippet,
  deleteSnippet,
  getAllSnippets,
  getAllSnippetsForPublic,
  getRawCode,
  getSnippet,
  searchSnippets,
  updateSnippet,
  toggleLike
} from "../controllers/snippets";
import { requireBody } from "../middleware";
import { protect, optionalProtect } from "../middleware/auth";

export const snippetRouter = Router();

// Public routes - accessible without authentication
snippetRouter.route("/public").get(getAllSnippetsForPublic);
snippetRouter.route("/statistics/public-tags").get(countPublicTags);
snippetRouter.route("/raw/:id").get(optionalProtect, getRawCode);

snippetRouter.route("/search").post(searchSnippets);
snippetRouter.route("/statistics/count").get(protect, countTags);

// Protected routes - require authentication
snippetRouter
  .route("/")
  .get(protect, getAllSnippets)
  .post(protect, requireBody("title", "language", "code"), createSnippet);

// Individual snippet routes
// Using optionalProtect to allow public access to public snippets
// while still identifying authenticated users
snippetRouter
  .route("/:id")
  .get(optionalProtect, getSnippet)
  .put(protect, updateSnippet)
  .delete(protect, deleteSnippet);

// Like endpoint
snippetRouter.route("/:id/like").put(protect, toggleLike);
