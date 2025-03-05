import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import {
  UserSavedSnippet,
  UserSavedSnippetCreationAttributes
} from '../typescript/interfaces';
import { SnippetModel } from './Snippet';
import { UserModel } from './User';

const { INTEGER, DATE } = DataTypes;

export interface UserSavedSnippetInstance
  extends Model<UserSavedSnippet, UserSavedSnippetCreationAttributes>,
    UserSavedSnippet {}

export const UserSavedSnippetModel = sequelize.define<UserSavedSnippetInstance>(
  'UserSavedSnippet',
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
    tableName: 'user_saved_snippets'
  }
);

// Define the associations between UserSavedSnippet and Snippet
UserSavedSnippetModel.belongsTo(SnippetModel, { foreignKey: 'snippetId', as: 'snippet' });
UserSavedSnippetModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' }); 