import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import { sequelize } from '../db';
import { asyncWrapper } from '../middleware';
import { SnippetModel, Snippet_TagModel, TagModel, UserModel } from '../models';
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
            // { is_public: true } // Public snippets
          ]
        } 
      : { is_public: true }; // Only public snippets for unauthenticated users
    
    console.log('Where clause:', whereClause);

    const snippets = await SnippetModel.findAll({
      where: whereClause,
      include: [
        {
          model: TagModel,
          as: 'tags',
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
      include: [
        {
          model: TagModel,
          as: 'tags',
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
    console.log('- User ID:', userId ? userId : 'Unauthenticated', 'Type:', typeof userId);
    console.log('- Snippet User ID:', snippetUserId, 'Type:', typeof snippetUserId);
    console.log('- Is Public:', isPublic);
    console.log('- Access allowed:', isPublic || userId === snippetUserId);

    // If snippet is private and user is not the owner, deny access
    // Direct string comparison for UUIDs
    if (!isPublic && (!userId || userId !== snippetUserId)) {
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

    console.log('updateSnippet userId', userId);
    console.log('updateSnippet snippetUserId', snippetUserId);

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
    
    let replacements = {};
    
    if (userId) {
      // Use quoted identifier for case-sensitive column name and parameterized query
      query += `WHERE snippets.user_id = :userId`;
      replacements = { userId };
    } else {
      query += `WHERE snippets.is_public = true`;
    }
    
    query += `
      GROUP BY tags.name
      ORDER BY name ASC
    `;

    const result = await sequelize.query(query, {
      replacements,
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
      where: { id: req.params.id }
    });
    
    console.log('getRawCode controller - Snippet ID:', req.params.id);
    console.log('getRawCode controller - User:', (req as any).user);

    if (!snippet) {
      console.log('getRawCode controller - Snippet not found');
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
    console.log('- User ID:', userId ? userId : 'Unauthenticated', 'Type:', typeof userId);
    console.log('- Snippet User ID:', snippetUserId, 'Type:', typeof snippetUserId);
    console.log('- Is Public:', isPublic);
    console.log('- Access allowed:', isPublic || userId === snippetUserId);

    // If snippet is private and user is not the owner, deny access
    // Direct string comparison for UUIDs
    if (!isPublic && (!userId || userId !== snippetUserId)) {
      console.log('getRawCode controller - Access denied');
      return next(
        new ErrorResponse(
          403,
          'Not authorized to access this snippet'
        )
      );
    }

    console.log('getRawCode controller - Access granted');
    res.status(200).send(snippet.get('code'));
  }
);

/**
 * @description Search snippets
 * @route /api/snippets/search
 * @request POST
 */
export const searchSnippets = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Handle both structured and simple search
    let searchQuery = '';
    let searchTags: string[] = [];
    let searchLanguages: string[] = [];

    // Check if the request body is a string (simple text search)
    if (typeof req.body === 'string' || req.body instanceof String) {
      searchQuery = req.body as string;
    } 
    // Check if it's a simple object with just a searchText property
    else if (req.body.searchText && typeof req.body.searchText === 'string') {
      searchQuery = req.body.searchText;
    } 
    // Otherwise, use the structured SearchQuery interface
    else {
      const { query, tags, languages } = <SearchQuery>req.body;
      searchQuery = query || '';
      searchTags = Array.isArray(tags) ? tags : [];
      searchLanguages = Array.isArray(languages) ? languages : [];
    }

    const userId = (req as any).user?.id;

    // Check if search parameters are empty
    if (searchQuery === '' && !searchTags.length && !searchLanguages.length) {
      res.status(200).json({
        data: []
      });
      return;
    }

    // Build the base query conditions
    const whereConditions: any = {};
    
    // Add user access conditions
    if (userId) {
      whereConditions[Op.or] = [
        { userId },
        { is_public: true }
      ];
    } else {
      whereConditions.is_public = true;
    }

    // Add language filter if specified
    if (searchLanguages.length) {
      // Convert languages to lowercase for case-insensitive comparison
      const lowerLanguages = searchLanguages.map(lang => lang.toLowerCase());
      whereConditions.language = sequelize.where(
        sequelize.fn('LOWER', sequelize.col('language')),
        { [Op.in]: lowerLanguages }
      );
    }

    // If there's a search query, use PostgreSQL full-text search
    if (searchQuery) {
      // Use raw SQL for the full-text search part
      const snippets = await sequelize.query(`
        SELECT DISTINCT ON (s.id) s.*, 
          ts_rank(s.search_vector, websearch_to_tsquery('english', lower(:query))) as rank
        FROM snippets s
        LEFT JOIN snippets_tags st ON s.id = st.snippet_id
        LEFT JOIN tags t ON st.tag_id = t.id
        WHERE 
          (s.search_vector @@ websearch_to_tsquery('english', lower(:query)) OR
           t.search_vector @@ websearch_to_tsquery('english', lower(:query)))
          ${userId ? `AND (s.user_id = :userId OR s.is_public = true)` : 'AND s.is_public = true'}
          ${searchLanguages.length ? `AND LOWER(s.language) IN (:languages)` : ''}
          ${searchTags.length ? `AND LOWER(t.name) IN (:tags)` : ''}
        ORDER BY s.id, rank DESC
      `, {
        replacements: {
          query: searchQuery,
          userId,
          languages: searchLanguages.length ? searchLanguages.map(lang => lang.toLowerCase()) : undefined,
          tags: searchTags.length ? searchTags.map(tag => tag.toLowerCase()) : undefined
        },
        type: QueryTypes.SELECT
      });

      // Get the tag information for each snippet
      const snippetIds = snippets.map((s: any) => s.id);
      
      if (snippetIds.length > 0) {
        const snippetsWithTags = await SnippetModel.findAll({
          where: { id: { [Op.in]: snippetIds } },
          include: [
            {
              model: TagModel,
              as: 'tags',
              attributes: ['name'],
              through: { attributes: [] }
            },
            {
              model: UserModel,
              as: 'user',
              attributes: ['id', 'email', 'user_name']
            }
          ],
          order: [['id', 'ASC']]
        });

        // Map the tags to each snippet
        const populatedSnippets = snippets.map((snippet: any) => {
          const matchingSnippet = snippetsWithTags.find(s => s.id === snippet.id);
          return {
            ...snippet,
            createdAt: snippet.createdAt || null,
            updatedAt: snippet.updatedAt || null,
            tags: matchingSnippet?.get('tags')?.map((tag: any) => tag.name) || [],
            user: matchingSnippet?.get('user') || null
          };
        });

        res.status(200).json({
          data: populatedSnippets
        });
      } else {
        res.status(200).json({
          data: []
        });
      }
    } else {
      // If no search query but has tag or language filters
      const includeOptions: any = {
        model: TagModel,
        as: 'tags',
        attributes: ['name'],
        through: { attributes: [] }
      };

      // Add tag filter if specified
      if (searchTags.length) {
        // Convert tags to lowercase for case-insensitive comparison
        const lowerTags = searchTags.map(tag => tag.toLowerCase());
        includeOptions.where = sequelize.where(
          sequelize.fn('LOWER', sequelize.col('tags.name')),
          { [Op.in]: lowerTags }
        );
      }

      // Use regular Sequelize query for tag/language only filtering
      const snippets = await SnippetModel.findAll({
        where: whereConditions,
        include: [
          includeOptions,
          {
            model: UserModel,
            as: 'user',
            attributes: ['id', 'email', 'user_name']
          }
        ]
      });

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
    
    // Get sort parameter from query string (default: most_liked)
    const sort = (req.query.sort as string) || 'most_liked';
    
    // Define order based on sort parameter
    let order: any;
    switch (sort) {
      case 'most_recent':
        order = [['updatedAt', 'DESC']];
        break;
      case 'most_liked':
      default:
        order = [['likes_count', 'DESC'], ['updatedAt', 'DESC']]; // Secondary sort by updated_at if likes are equal
        break;
    }

    // Get total count of public snippets
    const total = await SnippetModel.count({
      where: { is_public: true }
    });

    // Get paginated public snippets
    const snippets = await SnippetModel.findAll({
      where: { is_public: true },
      include: [
        {
          model: TagModel,
          as: 'tags',
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
      ],
      limit,
      offset,
      order // Use dynamic ordering based on sort parameter
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
      },
      sort // Include the sort parameter in the response
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

/**
 * @description Toggle like status of a snippet
 * @route /api/snippets/:id/like
 * @request PUT
 */
export const toggleLike = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id; // UUID is already a string, no need to parse
    const userId = (req as any).user?.id;

    // Find snippet
    const snippet = await SnippetModel.findByPk(id);

    if (!snippet) {
      return next(new ErrorResponse(404, `Snippet with id ${id} not found`));
    }

    // Check if user is authorized to like this snippet
    // For private snippets, only the owner can like it
    if (!snippet.is_public && userId && snippet.userId !== userId) {
      return next(
        new ErrorResponse(403, 'Not authorized to like this snippet')
      );
    }

    // Toggle the favorite (like) status
    const updatedSnippet = await snippet.update({
      favorite: !snippet.favorite
    });

    res.status(200).json({
      success: true,
      data: {
        id: updatedSnippet.id,
        favorite: updatedSnippet.favorite
      }
    });
  }
);
