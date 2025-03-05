import { Model } from '.';
import { Optional } from 'sequelize';

export interface Snippet extends Model {
  title: string;
  description: string;
  language: string;
  code: string;
  docs: string;
  isPinned: number;
  favorite: boolean;
  is_public: boolean;
  userId?: string;
  tags?: { name: string }[];
  likes_count: number;
}

export interface SnippetCreationAttributes
  extends Optional<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'likes_count'> {}
