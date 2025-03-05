import { Model } from '.';
import { User } from './Auth';

export interface NewSnippet {
  title: string;
  description?: string;
  language: string;
  code: string;
  docs?: string;
  isPinned: boolean;
  tags: string[];
  is_public?: boolean;
  userId?: string;
  likes_count?: number;
  user?: User;
}

export interface Snippet extends Model, NewSnippet {}
