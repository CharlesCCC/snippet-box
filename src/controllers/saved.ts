import { Request, Response, NextFunction } from 'express';
import { asyncWrapper } from '../middleware';
import { UserSavedSnippetModel, SnippetModel, UserModel } from '../models';
import { Op } from 'sequelize';

/**
 * @description Save a snippet
 * @route /api/saved
 * @request POST
 */
export const saveSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const { snippetId } = req.body;

    if (!snippetId) {
      res.status(400).json({
        success: false,
        error: 'Please provide a snippet ID'
      });
      return;
    }

    // Check if snippet exists
    const snippet = await SnippetModel.findByPk(snippetId);
    if (!snippet) {
      res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
      return;
    }

    // Check if already saved
    const existingSave = await UserSavedSnippetModel.findOne({
      where: {
        userId,
        snippetId
      }
    });

    if (existingSave) {
      res.status(400).json({
        success: false,
        error: 'Snippet already saved'
      });
      return;
    }

    // Save the snippet
    const savedSnippet = await UserSavedSnippetModel.create({
      userId,
      snippetId
    });

    res.status(201).json({
      success: true,
      data: savedSnippet
    });
  }
);

/**
 * @description Unsave a snippet
 * @route /api/saved/:id
 * @request DELETE
 */
export const unsaveSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;
    const snippetId = req.params.id;

    // Check if saved
    const savedSnippet = await UserSavedSnippetModel.findOne({
      where: {
        userId,
        snippetId
      }
    });

    if (!savedSnippet) {
      res.status(404).json({
        success: false,
        error: 'Saved snippet not found'
      });
      return;
    }

    // Delete the saved snippet
    await savedSnippet.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  }
);

/**
 * @description Get all saved snippets for a user
 * @route /api/saved
 * @request GET
 */
export const getSavedSnippets = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.id;

    // Get all saved snippet IDs
    const savedSnippets = await UserSavedSnippetModel.findAll({
      where: {
        userId
      }
    });

    const snippetIds = savedSnippets.map(saved => saved.snippetId);

    // Get the actual snippets
    const snippets = await SnippetModel.findAll({
      where: {
        id: {
          [Op.in]: snippetIds
        }
      },
      include: [
        {
          association: 'tags',
          attributes: ['name'],
          through: {
            attributes: []
          }
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'email', 'user_name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: snippets.length,
      data: snippets
    });
  }
);

/**
 * @description Check if a snippet is saved by the user
 * @route /api/saved/check/:id
 * @request GET
 */
export const checkSavedSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // If user is not authenticated, return false for isSaved
    if (!(req as any).user) {
      console.debug('User not authenticated, returning isSaved: false');
      res.status(200).json({
        success: true,
        data: {
          isSaved: false
        }
      });
      return;
    }
    
    const userId = (req as any).user.id;
    const snippetId = req.params.id;

    console.debug(`Checking if snippet ${snippetId} is saved by user ${userId}`);

    // Check if saved
    const savedSnippet = await UserSavedSnippetModel.findOne({
      where: {
        userId,
        snippetId
      }
    });

    res.status(200).json({
      success: true,
      data: {
        isSaved: !!savedSnippet
      }
    });
  }
); 