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
} from "../controllers/snippets";
import { requireBody } from "../middleware";
import { protect } from "../middleware/auth";

export const snippetRouter = Router();

// Public routes - accessible without authentication
snippetRouter.route("/public").get(getAllSnippetsForPublic);
snippetRouter.route("/statistics/public-tags").get(countPublicTags);
snippetRouter.route("/raw/:id").get(protect, getRawCode);

snippetRouter.route("/search").post(searchSnippets);
snippetRouter.route("/statistics/count").get(protect, countTags);

// Protected routes - require authentication
snippetRouter
  .route("/")
  .get(protect, getAllSnippets)
  .post(protect, requireBody("title", "language", "code"), createSnippet);

// Individual snippet routes
// GET can be public or protected - the controller will check access rights
// The protect middleware will attach the user to the request if authenticated
snippetRouter
  .route("/:id")
  .get(protect, getSnippet)
  .put(protect, updateSnippet)
  .delete(protect, deleteSnippet);
