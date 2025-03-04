import { Model } from '.';

export interface NewSnippet {
  title: string;
  description?: string;
  language: string;
  code: string;
  docs?: string;
  isPinned: boolean;
  tags: string[];
  is_public?: boolean;
  userId?: number;
}

export interface Snippet extends Model, NewSnippet {}
