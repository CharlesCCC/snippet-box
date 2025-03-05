import { Request, Response } from 'express';
import { CommentModel, UserModel } from '../models';
import { Op } from 'sequelize';
import { asyncWrapper } from '../middleware';

// @desc    Get comments for a snippet
// @route   GET /api/snippets/:snippetId/comments
// @access  Public/Private (depending on snippet visibility)
export const getComments = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { snippetId } = req.params;

    // Get all comments for the snippet
    const allComments = await CommentModel.findAll({
      where: { snippetId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(comment => !comment.parentId);
    const replies = allComments.filter(comment => comment.parentId);
    
    // Organize replies by parent ID
    const repliesByParentId: Record<string, any[]> = {};
    replies.forEach(reply => {
      if (reply.parentId) {
        if (!repliesByParentId[reply.parentId]) {
          repliesByParentId[reply.parentId] = [];
        }
        repliesByParentId[reply.parentId].push(reply);
      }
    });
    
    // Attach replies to their parent comments
    const commentsWithReplies = topLevelComments.map(comment => {
      // Using any to bypass TypeScript checking for this dynamic property
      const commentObj: any = comment.toJSON();
      commentObj.replies = repliesByParentId[comment.id] || [];
      return commentObj;
    });

    res.status(200).json({
      success: true,
      count: commentsWithReplies.length,
      data: commentsWithReplies
    });
  }
);

// @desc    Add comment to a snippet
// @route   POST /api/snippets/:snippetId/comments
// @access  Private
export const addComment = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { snippetId } = req.params;
    const { content, parentId, quotedText } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Extract mentioned users from content
    const mentionedUsernames = content.match(/@(\w+)/g) || [];
    const mentionedUsers = await UserModel.findAll({
      where: {
        user_name: {
          [Op.in]: mentionedUsernames.map((username: string) => username.substring(1))
        }
      },
      attributes: ['id']
    });
    const mentionedUserIds = mentionedUsers.map(user => user.id);

    const comment = await CommentModel.create({
      content,
      userId,
      snippetId,
      parentId: parentId || undefined,
      quotedText: quotedText || undefined,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    });

    // Fetch the created comment with user information
    const commentWithUser = await CommentModel.findByPk(comment.id, {
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: commentWithUser
    });
  }
);

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    let comment = await CommentModel.findByPk(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
      return;
    }

    // Check if user is the comment owner
    if (comment.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
      return;
    }

    // Extract mentioned users from content
    const mentionedUsernames = content.match(/@(\w+)/g) || [];
    const mentionedUsers = await UserModel.findAll({
      where: {
        user_name: {
          [Op.in]: mentionedUsernames.map((username: string) => username.substring(1))
        }
      },
      attributes: ['id']
    });
    const mentionedUserIds = mentionedUsers.map(user => user.id);

    // Update comment
    comment = await comment.update({
      content,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    });

    // Fetch the updated comment with user information
    const updatedComment = await CommentModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'user_name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedComment
    });
  }
);

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncWrapper(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const comment = await CommentModel.findByPk(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
      return;
    }

    // Check if user is the comment owner
    if (comment.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
      return;
    }

    // Delete the comment
    await comment.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  }
); 