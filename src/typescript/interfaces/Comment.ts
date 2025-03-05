import { Model } from './Model';
import { User } from './User';

export interface Comment extends Model {
  content: string;
  userId: string;
  snippetId: string;
  parentId?: string;
  mentionedUserIds?: string[];
  quotedText?: string;
  user?: User;
  replies?: Comment[];
}

export interface CommentCreationAttributes {
  content: string;
  snippetId: string;
  parentId?: string;
  quotedText?: string;
  mentionedUserIds?: string[];
}

export interface CommentWithUser extends Comment {
  user: User;
} 