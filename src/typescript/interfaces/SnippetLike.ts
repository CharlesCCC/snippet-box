import { Optional } from 'sequelize';

export interface SnippetLike {
  id: number;
  userId: number;
  snippetId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SnippetLikeCreationAttributes
  extends Optional<SnippetLike, 'id' | 'createdAt' | 'updatedAt'> {} 