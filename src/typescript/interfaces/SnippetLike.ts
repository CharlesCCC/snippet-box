import { Optional } from 'sequelize';

export interface SnippetLike {
  id: string;
  userId: string;
  snippetId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SnippetLikeCreationAttributes
  extends Optional<SnippetLike, 'id' | 'createdAt' | 'updatedAt'> {} 