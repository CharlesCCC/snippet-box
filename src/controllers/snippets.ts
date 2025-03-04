import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { sequelize } from '../db';
import { asyncWrapper } from '../middleware';
import { SnippetModel, Snippet_TagModel, TagModel } from '../models';
import { ErrorResponse, tagParser, Logger, createTags } from '../utils';
import { Body, SearchQuery } from '../typescript/interfaces';

/**
 * @description Create new snippet
 * @route /api/snippets
 * @request POST
 */
export const createSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Convert boolean values from string to proper boolean
    const body = {
      ...req.body,
      favorite: req.body.favorite === 'true' || req.body.favorite === true,
      is_public: req.body.is_public === 'true' || req.body.is_public === true,
      isPinned: req.body.isPinned === 'true' || req.body.isPinned === true ? 1 : 0,
      userId: (req as any).user?.id
    };

    // Get tags from request body
    const { language, tags: requestTags } = body;
    const parsedRequestTags = tagParser([
      ...requestTags,
      language.toLowerCase()
    ]);

    // Create snippet with converted boolean values
    const snippet = await SnippetModel.create({
      ...body,
      tags: [...parsedRequestTags].join(',')
    });

    // Create tags
    await createTags(parsedRequestTags, snippet.id);

    // Get raw snippet values
    const rawSnippet = snippet.get({ plain: true });

    res.status(201).json({
      data: {
        ...rawSnippet,
        tags: [...parsedRequestTags]
      }
    });
  }
);

/**
 * @description Get all snippets
 * @route /api/snippets
 * @request GET
 */
export const getAllSnippets = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the current user ID from request (if authenticated)
    const userId = (req as any).user?.id;
    
    // Add debug logging to inspect the request and user object
    console.log('Request user:', (req as any).user);
    console.log('User ID:', userId);

    // Build the where clause based on authentication status
    const whereClause = userId 
      ? { 
          [Op.or]: [
            { userId }, // User's own snippets
            { is_public: true } // Public snippets
          ]
        } 
      : { is_public: true }; // Only public snippets for unauthenticated users
    
    console.log('Where clause:', whereClause);

    const snippets = await SnippetModel.findAll({
      where: whereClause,
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    console.log('Found snippets:', snippets.length);

    const populatedSnippets = snippets.map(snippet => {
      const rawSnippet = snippet.get({ plain: true });
      return {
        ...rawSnippet,
        tags: rawSnippet.tags?.map(tag => tag.name)
      };
    });

    res.status(200).json({
      data: populatedSnippets
    });
  }
);

/**
 * @description Get single snippet by id
 * @route /api/snippets/:id
 * @request GET
 */
export const getSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log('getSnippet controller - Snippet ID:', req.params.id);
    console.log('getSnippet controller - User:', (req as any).user);
    
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      }
    });

    if (!snippet) {
      console.log('getSnippet controller - Snippet not found');
      return next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    // Check if user has access to this snippet
    const userId = (req as any).user?.id;
    const isPublic = snippet.get('is_public');
    const snippetUserId = snippet.get('userId');
    
    // Add debug logging
    console.log('Snippet access check:');
    console.log('- User ID:', userId, 'Type:', typeof userId);
    console.log('- Snippet User ID:', snippetUserId, 'Type:', typeof snippetUserId);
    console.log('- Is Public:', isPublic);
    console.log('- Access allowed:', isPublic || Number(userId) === Number(snippetUserId));

    // If snippet is private and user is not the owner, deny access
    // Convert both IDs to numbers for comparison to avoid type mismatches
    if (!isPublic && Number(userId) !== Number(snippetUserId)) {
      console.log('getSnippet controller - Access denied');
      return next(
        new ErrorResponse(
          403,
          'Not authorized to access this snippet'
        )
      );
    }

    console.log('getSnippet controller - Access granted');
    const rawSnippet = snippet.get({ plain: true });
    const populatedSnippet = {
      ...rawSnippet,
      tags: rawSnippet.tags?.map(tag => tag.name)
    };

    res.status(200).json({
      data: populatedSnippet
    });
  }
);

/**
 * @description Update snippet
 * @route /api/snippets/:id
 * @request PUT
 */
export const updateSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let snippet = await SnippetModel.findOne({
      where: { id: req.params.id }
    });

    if (!snippet) {
      return next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    // Check if user owns this snippet
    const userId = (req as any).user?.id;
    const snippetUserId = snippet.get('userId');

    // If user is not the owner, deny access
    if (userId !== snippetUserId) {
      return next(
        new ErrorResponse(
          403,
          'Not authorized to update this snippet'
        )
      );
    }

    // Convert boolean values
    const body = {
      ...req.body,
      favorite: req.body.favorite === 'true' || req.body.favorite === true,
      is_public: req.body.is_public === 'true' || req.body.is_public === true,
      isPinned: req.body.isPinned === 'true' || req.body.isPinned === true ? 1 : 0
    };

    // Get tags from request body
    const { language, tags: requestTags } = <Body>body;
    let parsedRequestTags = tagParser([...requestTags, language.toLowerCase()]);

    // Update snippet
    snippet = await snippet.update({
      ...body,
      tags: [...parsedRequestTags].join(',')
    });

    // Delete old tags and create new ones
    await Snippet_TagModel.destroy({ where: { snippet_id: req.params.id } });
    await createTags(parsedRequestTags, snippet.id);

    // Get raw snippet values
    const rawSnippet = snippet.get({ plain: true });

    res.status(200).json({
      data: {
        ...rawSnippet,
        tags: [...parsedRequestTags]
      }
    });
  }
);

/**
 * @description Delete snippet
 * @route /api/snippets/:id
 * @request DELETE
 */
export const deleteSnippet = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id }
    });

    if (!snippet) {
      return next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    // Check if user owns this snippet
    const userId = (req as any).user?.id;
    const snippetUserId = snippet.get('userId');

    // If user is not the owner, deny access
    if (userId !== snippetUserId) {
      return next(
        new ErrorResponse(
          403,
          'Not authorized to delete this snippet'
        )
      );
    }

    await Snippet_TagModel.destroy({ where: { snippet_id: req.params.id } });
    await snippet.destroy();

    res.status(200).json({
      data: {}
    });
  }
);

/**
 * @description Count tags
 * @route /api/snippets/statistics/count
 * @request GET
 */
export const countTags = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    
    let query = `
      SELECT
        COUNT(tags.name) as count,
        tags.name
      FROM snippets_tags
      INNER JOIN tags ON snippets_tags.tag_id = tags.id
      INNER JOIN snippets ON snippets_tags.snippet_id = snippets.id
    `;
    
    if (userId) {
      // Use quoted identifier for case-sensitive column name
      query += `WHERE (snippets."userId" = ${userId} OR snippets.is_public = true)`;
    } else {
      query += `WHERE snippets.is_public = true`;
    }
    
    query += `
      GROUP BY tags.name
      ORDER BY name ASC
    `;

    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    res.status(200).json({
      data: result
    });
  }
);

/**
 * @description Get raw snippet code
 * @route /api/snippets/raw/:id
 * @request GET
 */
export const getRawCode = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const snippet = await SnippetModel.findOne({
      where: { id: req.params.id },
      raw: true
    });

    if (!snippet) {
      return next(
        new ErrorResponse(
          404,
          `Snippet with id of ${req.params.id} was not found`
        )
      );
    }

    res.status(200).send(snippet.code);
  }
);

/**
 * @description Search snippets
 * @route /api/snippets/search
 * @request POST
 */
export const searchSnippets = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { query, tags, languages } = <SearchQuery>req.body;

    // Check if query is empty
    if (query === '' && !tags.length && !languages.length) {
      res.status(200).json({
        data: []
      });

      return;
    }

    const languageFilter = languages.length
      ? { [Op.in]: languages }
      : { [Op.notIn]: languages };

    const tagFilter = tags.length ? { [Op.in]: tags } : { [Op.notIn]: tags };

    const snippets = await SnippetModel.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { title: { [Op.substring]: `${query}` } },
              { description: { [Op.substring]: `${query}` } }
            ]
          },
          {
            language: languageFilter
          }
        ]
      },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        where: {
          name: tagFilter
        },
        through: {
          attributes: []
        }
      }
    });

    res.status(200).json({
      data: snippets
    });
  }
);

/**
 * @description Get all public snippets with pagination
 * @route /api/snippets/public
 * @request GET
 */
export const getAllSnippetsForPublic = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Get total count of public snippets
    const total = await SnippetModel.count({
      where: { is_public: true }
    });

    // Get paginated public snippets
    const snippets = await SnippetModel.findAll({
      where: { is_public: true },
      include: {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: {
          attributes: []
        }
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']] // Order by newest first
    });

    const populatedSnippets = snippets.map(snippet => {
      const rawSnippet = snippet.get({ plain: true });
      return {
        ...rawSnippet,
        tags: rawSnippet.tags?.map(tag => tag.name)
      };
    });

    res.status(200).json({
      data: populatedSnippets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  }
);

/**
 * @description Count public tags only
 * @route /api/snippets/statistics/public-tags
 * @request GET
 */
export const countPublicTags = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await sequelize.query(
      `SELECT
        COUNT(tags.name) as count,
        tags.name
      FROM snippets_tags
      INNER JOIN tags ON snippets_tags.tag_id = tags.id
      INNER JOIN snippets ON snippets_tags.snippet_id = snippets.id
      WHERE snippets.is_public = true
      GROUP BY tags.name
      ORDER BY name ASC`,
      {
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json({
      data: result
    });
  }
);
