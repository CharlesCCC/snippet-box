import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import { Tag, TagCreationAttributes } from '../typescript/interfaces';

const { UUID, UUIDV4, STRING } = DataTypes;

export interface TagInstance extends Model<Tag, TagCreationAttributes>, Tag {}

export const TagModel = sequelize.define<TagInstance>(
  'Tag',
  {
    id: {
      type: UUID,
      primaryKey: true,
      defaultValue: UUIDV4
    },
    name: {
      type: STRING,
      allowNull: false,
      unique: true
    }
  },
  {
    timestamps: false,
    tableName: 'tags'
  }
);
