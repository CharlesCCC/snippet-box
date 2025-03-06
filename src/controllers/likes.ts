import { Request, Response, NextFunction } from "express";
import { asyncWrapper } from "../middleware";
import { SnippetLikeModel, SnippetModel } from "../models";
import { ErrorResponse } from "../utils";
import { sequelize } from "../db";

/**
 * @description Like a snippet
 * @route /api/likes/:id
 * @request POST
 */
export const likeSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const snippetId = req.params.id;

    // Check if snippet exists
    const snippet = await SnippetModel.findByPk(snippetId);
    if (!snippet) {
      return next(
        new ErrorResponse(404, `Snippet with id ${snippetId} not found`)
      );
    }

    // Check if already liked
    const existingLike = await SnippetLikeModel.findOne({
      where: {
        userId,
        snippetId,
      },
    });

    if (existingLike) {
      return next(
        new ErrorResponse(400, "You have already liked this snippet")
      );
    }

    // Use a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Create the like
      await SnippetLikeModel.create(
        {
          userId,
          snippetId,
        },
        { transaction }
      );

      // Increment the likes_count on the snippet
      await snippet.increment("likes_count", { transaction });

      // Commit the transaction
      await transaction.commit();

      // Get the updated snippet
      const updatedSnippet = await SnippetModel.findByPk(snippetId);

      res.status(200).json({
        success: true,
        data: {
          id: snippetId,
          likes_count: updatedSnippet?.likes_count || 0,
          liked: true,
        },
      });
    } catch (error) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      return next(new ErrorResponse(500, "Error liking snippet"));
    }
  }
);

/**
 * @description Unlike a snippet
 * @route /api/likes/:id
 * @request DELETE
 */
export const unlikeSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const snippetId = req.params.id;

    // Check if snippet exists
    const snippet = await SnippetModel.findByPk(snippetId);
    if (!snippet) {
      return next(
        new ErrorResponse(404, `Snippet with id ${snippetId} not found`)
      );
    }

    // Check if liked
    const existingLike = await SnippetLikeModel.findOne({
      where: {
        userId,
        snippetId,
      },
    });

    if (!existingLike) {
      return next(new ErrorResponse(400, "You have not liked this snippet"));
    }

    // Use a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Delete the like
      await existingLike.destroy({ transaction });

      // Decrement the likes_count on the snippet
      await snippet.decrement("likes_count", { transaction });

      // Commit the transaction
      await transaction.commit();

      // Get the updated snippet
      const updatedSnippet = await SnippetModel.findByPk(snippetId);

      res.status(200).json({
        success: true,
        data: {
          id: snippetId,
          likes_count: updatedSnippet?.likes_count || 0,
          liked: false,
        },
      });
    } catch (error) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      return next(new ErrorResponse(500, "Error unliking snippet"));
    }
  }
);

/**
 * @description Check if user has liked a snippet
 * @route /api/likes/check/:id
 * @request GET
 */
export const checkLiked = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    const snippetId = req.params.id;

    if (!userId) {
      return;
    }
    
    // Check if snippet exists
    const snippet = await SnippetModel.findByPk(snippetId);
    if (!snippet) {
      return next(
        new ErrorResponse(404, `Snippet with id ${snippetId} not found`)
      );
    }

    console.debug(
      `Checking if snippet ${snippetId} is liked by user ${
        userId || "unauthenticated"
      }`
    );

    // Check if liked - only if user is authenticated
    let liked = false;

    const existingLike = await SnippetLikeModel.findOne({
      where: {
        userId,
        snippetId,
      },
    });
    liked = !!existingLike;

    res.status(200).json({
      success: true,
      data: {
        liked,
        likes_count: snippet.likes_count,
      },
    });
  }
);
