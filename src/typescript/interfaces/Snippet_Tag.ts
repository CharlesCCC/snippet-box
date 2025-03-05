import { Optional } from 'sequelize';

export interface Snippet_Tag {
  id: string;       // UUID stored as string
  snippet_id: string; // UUID stored as string
  tag_id: string;   // UUID stored as string
}

export interface Snippet_TagCreationAttributes
  extends Optional<Snippet_Tag, 'id'> {}
