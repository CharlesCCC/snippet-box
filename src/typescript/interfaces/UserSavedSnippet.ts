import { Optional } from 'sequelize';

export interface UserSavedSnippet {
  id: number;
  userId: number;
  snippetId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSavedSnippetCreationAttributes
  extends Optional<UserSavedSnippet, 'id' | 'createdAt' | 'updatedAt'> {} 