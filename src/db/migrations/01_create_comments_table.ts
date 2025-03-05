import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { Logger } from '../../utils';

const logger = new Logger('migration[create-comments]');

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    logger.log('Creating comments table');
    
    await queryInterface.createTable('comments', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      snippet_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'snippets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'comments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mentioned_user_ids: {
        type: DataTypes.JSON,
        allowNull: true
      },
      quoted_text: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster queries
    await queryInterface.addIndex('comments', ['snippet_id']);
    await queryInterface.addIndex('comments', ['user_id']);
    await queryInterface.addIndex('comments', ['parent_id']);
    
    logger.log('Comments table created successfully');
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    logger.log('Dropping comments table');
    await queryInterface.dropTable('comments');
    logger.log('Comments table dropped successfully');
  }
}; 