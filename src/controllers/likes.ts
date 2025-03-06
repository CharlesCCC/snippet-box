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

    // Check if snippet exists first
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

    // If no user is authenticated, return not liked but include likes count
    if (!userId) {
      res.status(200).json({
        success: true,
        data: {
          liked: false,
          likes_count: snippet.likes_count
        }
      });
      return;
    }

    // Check if liked - only if user is authenticated
    const existingLike = await SnippetLikeModel.findOne({
      where: {
        userId,
        snippetId,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        liked: !!existingLike,
        likes_count: snippet.likes_count,
      },
    });
  }
);

/**
 * @description Batch check if user has liked multiple snippets
 * @route /api/likes/check-batch
 * @request POST
 */
export const batchCheckLiked = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return next(new ErrorResponse(400, 'IDs must be provided as an array'));
    }
    
    // Limit the number of IDs to prevent abuse
    const snippetIds = ids.slice(0, 100);
    
    console.debug(
      `Batch checking ${snippetIds.length} snippets for likes by user ${
        userId || "unauthenticated"
      }`
    );
    
    // Create result object
    const results: Record<string, { liked: boolean; likes_count: number }> = {};
    
    // Get likes count for all snippets in batch
    const likesCounts = await SnippetLikeModel.findAll({
      attributes: [
        'snippetId',
        [SnippetLikeModel.sequelize!.fn('COUNT', 'snippet_id'), 'count']
      ],
      where: {
        snippetId: snippetIds
      },
      group: ['snippetId']
    });
    
    // Initialize all results with liked = false and likes_count = 0
    snippetIds.forEach(id => {
      results[id] = { liked: false, likes_count: 0 };
    });
    
    // Update likes count for found snippets
    likesCounts.forEach((likeCount: any) => {
      const id = likeCount.get('snippetId');
      results[id].likes_count = parseInt(likeCount.get('count'), 10);
    });
    
    // If authenticated, check which snippets are liked by the user
    if (userId) {
      const userLikes = await SnippetLikeModel.findAll({
        where: {
          userId: userId,
          snippetId: snippetIds
        }
      });
      
      // Mark liked snippets
      userLikes.forEach((like: any) => {
        const id = like.snippetId;
        if (results[id]) {
          results[id].liked = true;
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  }
);
