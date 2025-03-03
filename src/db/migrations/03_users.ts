import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add userId column to snippets table
    await queryInterface.addColumn('snippets', 'userId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove userId column from snippets
    await queryInterface.removeColumn('snippets', 'userId');
    
    // Drop users table
    await queryInterface.dropTable('users');
  }
}; 