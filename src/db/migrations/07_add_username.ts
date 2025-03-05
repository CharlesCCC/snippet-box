import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Add user_name column to users table
    await queryInterface.addColumn('users', 'user_name', {
      type: DataTypes.STRING,
      allowNull: true, // Initially allow null for existing users
      unique: true
    });

    // Generate random usernames for existing users
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users',
      { type: 'SELECT' as const }
    );

    // Update each user with a random username
    for (const user of users as {id: number}[]) {
      const randomUsername = `PromptUp_${Math.random().toString(36).substring(2, 10)}`;
      await queryInterface.sequelize.query(
        `UPDATE users SET user_name = ? WHERE id = ?`,
        {
          replacements: [randomUsername, user.id],
          type: 'UPDATE' as const
        }
      );
    }

    // Now make the column not nullable after all users have usernames
    await queryInterface.changeColumn('users', 'user_name', {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove user_name column from users table
    await queryInterface.removeColumn('users', 'user_name');
  }
}; 