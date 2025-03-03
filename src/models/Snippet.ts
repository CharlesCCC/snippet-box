import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import { Snippet, SnippetCreationAttributes } from '../typescript/interfaces';
import { UserModel } from './User';

const { INTEGER, STRING, DATE, TEXT } = DataTypes;

export interface SnippetInstance
  extends Model<Snippet, SnippetCreationAttributes>,
    Snippet {}

export const SnippetModel = sequelize.define<SnippetInstance>(
  'Snippet',
  {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      defaultValue: 0
    },
    userId: {
      type: INTEGER,
      allowNull: true, // Make nullable for backward compatibility with existing data
      references: {
        model: 'users',
        key: 'id'
      }
    },
    createdAt: {
      type: DATE
    },
    updatedAt: {
      type: DATE
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    tableName: 'snippets'
  }
);

// Set up relation between User and Snippet
UserModel.hasMany(SnippetModel, { foreignKey: 'userId' });
SnippetModel.belongsTo(UserModel, { foreignKey: 'userId' });
