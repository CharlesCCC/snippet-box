import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create user_saved_snippets table for tracking saved snippets
    await queryInterface.createTable('user_saved_snippets', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      snippetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'snippets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add unique constraint to prevent duplicate saves
    await queryInterface.addIndex('user_saved_snippets', ['userId', 'snippetId'], {
      unique: true,
      name: 'user_saved_snippets_unique'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('user_saved_snippets');
  }
}; 