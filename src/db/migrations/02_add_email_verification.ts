import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Migration to add email verification fields to users table
 */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Add email verification columns to users table
    await queryInterface.addColumn('users', 'is_email_verified', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'email_verification_token', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'email_verification_expire', {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove email verification columns from users table
    await queryInterface.removeColumn('users', 'is_email_verified');
    await queryInterface.removeColumn('users', 'email_verification_token');
    await queryInterface.removeColumn('users', 'email_verification_expire');
  }
}; 