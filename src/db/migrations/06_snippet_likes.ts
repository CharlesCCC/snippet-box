import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create snippet_likes table for tracking likes
    await queryInterface.createTable('snippet_likes', {
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

    // Add unique constraint to prevent duplicate likes
    await queryInterface.addIndex('snippet_likes', ['userId', 'snippetId'], {
      unique: true,
      name: 'snippet_likes_unique'
    });

    // Add a likes_count column to snippets table
    await queryInterface.addColumn('snippets', 'likes_count', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('snippets', 'likes_count');
    await queryInterface.dropTable('snippet_likes');
  }
}; 