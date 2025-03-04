import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import {
  SnippetLike,
  SnippetLikeCreationAttributes
} from '../typescript/interfaces';

const { INTEGER, DATE } = DataTypes;

export interface SnippetLikeInstance
  extends Model<SnippetLike, SnippetLikeCreationAttributes>,
    SnippetLike {}

export const SnippetLikeModel = sequelize.define<SnippetLikeInstance>(
  'SnippetLike',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    snippetId: {
      type: INTEGER,
      allowNull: false,
      references: {
        model: 'snippets',
        key: 'id'
      }
    },
    createdAt: {
      type: DATE
    },
    updatedAt: {
      type: DATE
    }
  },
  {
    tableName: 'snippet_likes'
  }
); 