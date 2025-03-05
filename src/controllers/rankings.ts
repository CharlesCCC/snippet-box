import { Request, Response, NextFunction } from 'express';
import { Op, Sequelize } from 'sequelize';
import { asyncWrapper } from '../middleware';
import { 
  SnippetModel, 
  UserModel, 
  SnippetLikeModel, 
  UserSavedSnippetModel 
} from '../models';
import NodeCache from 'node-cache';

// Cache with 24 hour TTL
const rankingsCache = new NodeCache({ stdTTL: 60 * 60 * 24 });

// Helper to generate cache keys based on params
const getCacheKey = (category: string, timeRange: string) => {
  return `${category}_${timeRange}`;
};

// Helper to get date for time range filtering
const getDateForTimeRange = (timeRange: string) => {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      return new Date(now.setHours(now.getHours() - 24));
    case '1w':
      return new Date(now.setDate(now.getDate() - 7));
    case '1m':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3m':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6m':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
    default:
      return new Date(0); // Beginning of time
  }
};

/**
 * @description Get top users by likes received on their snippets
 * @route GET /api/rankings/users/likes
 */
export const getTopUsersByLikes = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const timeRange = req.query.timeRange as string || 'all';
    const limit = Number(req.query.limit) || 10;
    
    const cacheKey = getCacheKey('users_by_likes', timeRange);
    const cachedData = rankingsCache.get(cacheKey);
    
    if (cachedData) {
      res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
      return;
    }
    
    const fromDate = getDateForTimeRange(timeRange);
    
    const results = await SnippetModel.findAll({
      attributes: [
        'userId',
        [Sequelize.fn('SUM', Sequelize.col('likes_count')), 'total_likes']
      ],
      where: {
        userId: { [Op.ne]: null } as any,
        ...(timeRange !== 'all' && { createdAt: { [Op.gte]: fromDate } })
      },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_name']
        }
      ],
      group: ['userId', 'user.id'],
      order: [[Sequelize.literal('total_likes'), 'DESC']],
      limit
    });
    
    const topUsers = results.map(result => {
      const user = result.get('user') as any;
      return {
        userId: result.get('userId'),
        user_name: user ? user.user_name : 'Unknown',
        total_likes: parseInt(result.get('total_likes') as string, 10)
      };
    });
    
    // Cache the results
    rankingsCache.set(cacheKey, topUsers);
    
    res.status(200).json({
      success: true,
      data: topUsers,
      cached: false
    });
  }
);

/**
 * @description Get top users by saves received on their snippets
 * @route GET /api/rankings/users/saves
 */
export const getTopUsersBySaves = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const timeRange = req.query.timeRange as string || 'all';
    const limit = Number(req.query.limit) || 10;
    
    const cacheKey = getCacheKey('users_by_saves', timeRange);
    const cachedData = rankingsCache.get(cacheKey);
    
    if (cachedData) {
      res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
      return;
    }
    
    const fromDate = getDateForTimeRange(timeRange);
    
    // First get snippets with save counts
    const snippetSaves = await UserSavedSnippetModel.findAll({
      attributes: [
        'snippetId',
        [Sequelize.fn('COUNT', Sequelize.col('snippetId')), 'save_count']
      ],
      where: {
        ...(timeRange !== 'all' && { createdAt: { [Op.gte]: fromDate } })
      },
      include: [
        {
          model: SnippetModel,
          as: 'snippet',
          required: true,
          include: [
            {
              model: UserModel,
              as: 'user',
              required: true,
              attributes: ['id', 'user_name']
            }
          ]
        }
      ],
      group: ['snippetId', 'snippet.id', 'snippet.userId', 'snippet.user.id'],
      order: [[Sequelize.literal('save_count'), 'DESC']]
    });
    
    // Aggregate by user
    const userSavesMap = new Map();
    
    snippetSaves.forEach(result => {
      const snippet = result.get('snippet') as any;
      if (!snippet || !snippet.user) return;
      
      const userId = snippet.userId;
      const user_name = snippet.user.user_name;
      const saveCount = parseInt(result.get('save_count') as string, 10);
      
      if (userSavesMap.has(userId)) {
        userSavesMap.set(userId, {
          ...userSavesMap.get(userId),
          total_saves: userSavesMap.get(userId).total_saves + saveCount
        });
      } else {
        userSavesMap.set(userId, {
          userId,
          user_name,
          total_saves: saveCount
        });
      }
    });
    
    // Convert map to array and sort
    const topUsers = Array.from(userSavesMap.values())
      .sort((a, b) => b.total_saves - a.total_saves)
      .slice(0, limit);
    
    // Cache the results
    rankingsCache.set(cacheKey, topUsers);
    
    res.status(200).json({
      success: true,
      data: topUsers,
      cached: false
    });
  }
);

/**
 * @description Get top liked snippets
 * @route GET /api/rankings/snippets/likes
 */
export const getTopLikedSnippets = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const timeRange = req.query.timeRange as string || 'all';
    const limit = Number(req.query.limit) || 10;
    
    const cacheKey = getCacheKey('snippets_by_likes', timeRange);
    const cachedData = rankingsCache.get(cacheKey);
    
    if (cachedData) {
      res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
      return;
    }
    
    const fromDate = getDateForTimeRange(timeRange);
    
    const results = await SnippetModel.findAll({
      attributes: [
        'id',
        'title',
        'description',
        'language',
        'likes_count',
        'createdAt'
      ],
      where: {
        ...(timeRange !== 'all' && { createdAt: { [Op.gte]: fromDate } })
      },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_name']
        }
      ],
      order: [['likes_count', 'DESC']],
      limit
    });
    
    // Cache the results
    rankingsCache.set(cacheKey, results);
    
    res.status(200).json({
      success: true,
      data: results,
      cached: false
    });
  }
);

/**
 * @description Get top saved snippets
 * @route GET /api/rankings/snippets/saves
 */
export const getTopSavedSnippets = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const timeRange = req.query.timeRange as string || 'all';
    const limit = Number(req.query.limit) || 10;
    
    const cacheKey = getCacheKey('snippets_by_saves', timeRange);
    const cachedData = rankingsCache.get(cacheKey);
    
    if (cachedData) {
      res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
      return;
    }
    
    const fromDate = getDateForTimeRange(timeRange);
    
    // For this query, we'll get counts and then include snippets
    const results = await UserSavedSnippetModel.findAll({
      attributes: [
        'snippetId',
        [Sequelize.fn('COUNT', Sequelize.col('snippetId')), 'save_count']
      ],
      where: {
        ...(timeRange !== 'all' && { createdAt: { [Op.gte]: fromDate } })
      },
      include: [
        {
          model: SnippetModel,
          as: 'snippet',
          required: true,
          include: [
            {
              model: UserModel,
              as: 'user',
              required: true,
              attributes: ['id', 'user_name']
            }
          ]
        }
      ],
      group: ['snippetId', 'snippet.id', 'snippet.user.id'],
      order: [[Sequelize.literal('save_count'), 'DESC']],
      limit
    });
    
    const formattedResults = results.map(result => {
      const snippet = result.get('snippet') as any;
      if (!snippet) return null;
      
      return {
        id: snippet.id,
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        createdAt: snippet.createdAt,
        user: snippet.user,
        save_count: parseInt(result.get('save_count') as string, 10)
      };
    }).filter(Boolean);
    
    // Cache the results
    rankingsCache.set(cacheKey, formattedResults);
    
    res.status(200).json({
      success: true,
      data: formattedResults,
      cached: false
    });
  }
);

//TODO: admin support needed 
// Add a method to manually invalidate the cache (useful for admin purposes)
export const invalidateRankingsCache = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    rankingsCache.flushAll();
    
    res.status(200).json({
      success: true,
      message: 'Rankings cache invalidated'
    });
  }
); 