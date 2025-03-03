import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export const UserModel = sequelize.define<UserInstance>(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'users',
    hooks: {
      beforeSave: async (user: UserInstance) => {
        // Only hash password if it's modified or new
        if (!user.changed('password')) return;
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
);

// Method to compare passwords
UserModel.prototype.comparePassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
}; 