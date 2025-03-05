import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import { UserModel } from './User';
import { SnippetModel } from './Snippet';

export interface CommentAttributes {
  id: string; // UUID stored as string
  content: string;
  userId: string;
  snippetId: string;
  parentId?: string; // For reply threading - refers to parent comment ID
  mentionedUserIds?: string[]; // Stores IDs of users mentioned with @
  quotedText?: string; // Stores quoted text when using quote-reply
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentCreationAttributes
  extends Omit<CommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class CommentInstance
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes {
  public id!: string;
  public content!: string;
  public userId!: string;
  public snippetId!: string;
  public parentId?: string;
  public mentionedUserIds?: string[];
  public quotedText?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
CommentInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    snippetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'snippets',
        key: 'id'
      },
      field: 'snippet_id'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      },
      field: 'parent_id'
    },
    mentionedUserIds: {
      type: DataTypes.JSON, // Using JSON to store arrays in SQLite
      allowNull: true,
      field: 'mentioned_user_ids'
    },
    quotedText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'quoted_text'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  },
  {
    tableName: 'comments',
    sequelize,
    underscored: true
  }
);

// Set up relations
UserModel.hasMany(CommentInstance, { foreignKey: 'user_id', as: 'comments' });
CommentInstance.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });

SnippetModel.hasMany(CommentInstance, { foreignKey: 'snippet_id', as: 'comments' });
CommentInstance.belongsTo(SnippetModel, { foreignKey: 'snippet_id', as: 'snippet' });

// Self-referencing for comment replies
CommentInstance.hasMany(CommentInstance, { foreignKey: 'parent_id', as: 'replies' });
CommentInstance.belongsTo(CommentInstance, { foreignKey: 'parent_id', as: 'parent' });

export const CommentModel = CommentInstance; 