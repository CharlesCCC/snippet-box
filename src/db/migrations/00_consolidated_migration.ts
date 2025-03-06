import { QueryInterface, DataTypes, Sequelize } from 'sequelize';
import { Logger } from '../../utils';

const logger = new Logger('migration[consolidated]');

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Create UUID extension if it doesn't exist (for PostgreSQL)
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // 00_initial.ts - Create snippets table
    await queryInterface.createTable('snippets', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false
      },
      code: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      docs: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      favorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      likes_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });

    // 02_tags.ts - Create tags table
    await queryInterface.createTable('tags', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    });

    // 02_tags.ts - Create snippets_tags table
    await queryInterface.createTable('snippets_tags', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
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
      tag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // 03_users.ts - Create users table
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
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
      reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      reset_password_expire: {
        type: DataTypes.DATE,
        allowNull: true
      },
      user_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // 03_users.ts - Add user_id column to snippets table
    await queryInterface.addColumn('snippets', 'user_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 05_user_saved_snippets.ts - Create user_saved_snippets table
    await queryInterface.createTable('user_saved_snippets', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // 05_user_saved_snippets.ts - Add unique constraint
    await queryInterface.addIndex('user_saved_snippets', ['user_id', 'snippet_id'], {
      unique: true,
      name: 'user_saved_snippets_unique'
    });

    // 06_snippet_likes.ts - Create snippet_likes table
    await queryInterface.createTable('snippet_likes', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // 06_snippet_likes.ts - Add unique constraint
    await queryInterface.addIndex('snippet_likes', ['user_id', 'snippet_id'], {
      unique: true,
      name: 'snippet_likes_unique'
    });

    // 04_add_fulltext_search.ts - Add tsvector columns for full-text search
    await queryInterface.sequelize.query(`
      -- Add tsvector columns to snippets table
      ALTER TABLE snippets 
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', lower(coalesce(title, ''))), 'A') || 
        setweight(to_tsvector('english', lower(coalesce(description, ''))), 'B')
      ) STORED;

      -- Add tsvector column to tags table
      ALTER TABLE tags
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', lower(coalesce(name, ''))), 'C')
      ) STORED;

      -- Create GIN indexes for fast full-text search
      CREATE INDEX idx_snippets_search_vector ON snippets USING GIN(search_vector);
      CREATE INDEX idx_tags_search_vector ON tags USING GIN(search_vector);
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove full-text search indexes and columns
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_snippets_search_vector;
      DROP INDEX IF EXISTS idx_tags_search_vector;
      
      ALTER TABLE snippets DROP COLUMN IF EXISTS search_vector;
      ALTER TABLE tags DROP COLUMN IF EXISTS search_vector;
    `);

    // Drop tables in reverse order of creation to respect foreign key constraints
    await queryInterface.dropTable('snippet_likes');
    await queryInterface.dropTable('user_saved_snippets');
    await queryInterface.removeColumn('snippets', 'user_id');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('snippets_tags');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('snippets');

    // Drop UUID extension if needed (commented out for safety)
    // await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
  }
}; 