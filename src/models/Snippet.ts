import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import { Snippet, SnippetCreationAttributes } from '../typescript/interfaces';
import { UserModel } from './User';

const { UUID, UUIDV4, STRING, DATE, TEXT, INTEGER } = DataTypes;

export interface SnippetInstance
  extends Model<Snippet, SnippetCreationAttributes>,
    Snippet {}

export const SnippetModel = sequelize.define<SnippetInstance>(
  'Snippet',
  {
    id: {
      type: UUID,
      primaryKey: true,
      defaultValue: UUIDV4
    },
    title: {
      type: STRING,
      allowNull: false
    },
    description: {
      type: TEXT,
      allowNull: true,
      defaultValue: ''
    },
    language: {
      type: STRING,
      allowNull: false
    },
    code: {
      type: TEXT,
      allowNull: false
    },
    docs: {
      type: TEXT,
      allowNull: true,
      defaultValue: ''
    },
    isPinned: {
      type: INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'is_pinned'
    },
    userId: {
      type: UUID,
      allowNull: true, // Make nullable for backward compatibility with existing data
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    createdAt: {
      type: DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DATE,
      field: 'updated_at'
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    likes_count: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'snippets',
    underscored: true
  }
);

// Set up relation between User and Snippet
UserModel.hasMany(SnippetModel, { foreignKey: 'user_id', as: 'snippets' });
SnippetModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });
