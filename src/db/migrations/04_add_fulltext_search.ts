import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Add tsvector columns for full-text search
    await queryInterface.sequelize.query(`
      -- Add tsvector columns to snippets table
      ALTER TABLE snippets 
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
      ) STORED;

      -- Add tsvector column to tags table
      ALTER TABLE tags
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'C')
      ) STORED;

      -- Create GIN indexes for fast full-text search
      CREATE INDEX idx_snippets_search_vector ON snippets USING GIN(search_vector);
      CREATE INDEX idx_tags_search_vector ON tags USING GIN(search_vector);
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove indexes and tsvector columns
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_snippets_search_vector;
      DROP INDEX IF EXISTS idx_tags_search_vector;
      
      ALTER TABLE snippets DROP COLUMN IF EXISTS search_vector;
      ALTER TABLE tags DROP COLUMN IF EXISTS search_vector;
    `);
  }
}; 