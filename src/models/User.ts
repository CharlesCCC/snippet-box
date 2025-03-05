import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string; // UUID stored as string
  email: string;
  password: string;
  user_name: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Create a class that extends Model with the instance method
export class UserInstance extends Model<UserAttributes, UserCreationAttributes> 
  implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public user_name!: string;
  public resetPasswordToken?: string;
  public resetPasswordExpire?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method
  public async comparePassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

// Initialize the model with the class
UserInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: () => {
        // Generate a random username if not provided
        return 'PromptUp_' + Math.random().toString(36).substring(2, 10);
      }
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'reset_password_token'
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_expire'
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
    tableName: 'users',
    sequelize,
    underscored: true,
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

export const UserModel = UserInstance; 