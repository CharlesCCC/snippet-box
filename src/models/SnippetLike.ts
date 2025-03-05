import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import {
  SnippetLike,
  SnippetLikeCreationAttributes
} from '../typescript/interfaces';

const { UUID, UUIDV4, DATE } = DataTypes;

export interface SnippetLikeInstance
  extends Model<SnippetLike, SnippetLikeCreationAttributes>,
    SnippetLike {}

export const SnippetLikeModel = sequelize.define<SnippetLikeInstance>(
  'SnippetLike',
  {
    id: {
      type: UUID,
      primaryKey: true,
      defaultValue: UUIDV4
    },
    userId: {
      type: UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    snippetId: {
      type: UUID,
      allowNull: false,
      references: {
        model: 'snippets',
        key: 'id'
      },
      field: 'snippet_id'
    },
    createdAt: {
      type: DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DATE,
      field: 'updated_at'
    }
  },
  {
    tableName: 'snippet_likes',
    underscored: true
  }
); 