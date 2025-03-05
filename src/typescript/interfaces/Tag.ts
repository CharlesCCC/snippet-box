import { Optional } from 'sequelize';

export interface Tag {
  id: string; // UUID stored as string
  name: string;
}

export interface TagCreationAttributes extends Optional<Tag, 'id'> {}
