import { Optional } from 'sequelize';

export interface UserSavedSnippet {
  id: string;           // UUID stored as string
  userId: string;       // maps to 'user_id' in DB (UUID)
  snippetId: string;    // maps to 'snippet_id' in DB (UUID)
  createdAt?: Date;     // maps to 'created_at' in DB
  updatedAt?: Date;     // maps to 'updated_at' in DB
}

export interface UserSavedSnippetCreationAttributes
  extends Optional<UserSavedSnippet, 'id' | 'createdAt' | 'updatedAt'> {} 