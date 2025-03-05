import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import {
  Snippet_Tag,
  Snippet_TagCreationAttributes
} from '../typescript/interfaces';

const { UUID, UUIDV4 } = DataTypes;

export interface Snippet_TagInstance
  extends Model<Snippet_Tag, Snippet_TagCreationAttributes>,
    Snippet_Tag {}

export const Snippet_TagModel = sequelize.define<Snippet_TagInstance>(
  'Snippet_Tag',
  {
    id: {
      type: UUID,
      primaryKey: true,
      defaultValue: UUIDV4
    },
    snippet_id: {
      type: UUID,
      allowNull: false,
      references: {
        model: 'snippets',
        key: 'id'
      }
    },
    tag_id: {
      type: UUID,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id'
      }
    }
  },
  {
    timestamps: false,
    tableName: 'snippets_tags'
  }
);
