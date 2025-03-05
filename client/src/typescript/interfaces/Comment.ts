import { Model } from '.';
import { User } from './Auth';

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