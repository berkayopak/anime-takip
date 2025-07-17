/**
 * Add has_new_episode column migration
 * This migration adds the has_new_episode column if it doesn't exist
 * (exact copy from database.js runMigrations method)
 */

const migration = {
  version: '002',
  description: 'Add has_new_episode column to animes table',

  /**
   * Apply migration
   */
  up: async (db) => {
    return new Promise((resolve, reject) => {
      // Check if column exists first (exact copy from database.js)
      db.all("PRAGMA table_info(animes)", (err, columns) => {
        if (err) {
          console.error('Failed to check table structure:', err);
          reject(err);
          return;
        }
        
        const hasNewEpisodeColumn = columns.some(col => col.name === 'has_new_episode');
        
        if (!hasNewEpisodeColumn) {
          // Add has_new_episode column if it doesn't exist (exact copy from database.js)
          db.run(`
            ALTER TABLE animes ADD COLUMN has_new_episode INTEGER DEFAULT 0
          `, (err) => {
            if (err) {
              console.error('Migration failed:', err);
              reject(err);
            } else {
              console.log('Migration: Added has_new_episode column');
              resolve();
            }
          });
        } else {
          console.log('Migration: has_new_episode column already exists');
          resolve();
        }
      });
    });
  },

  /**
   * Rollback migration
   */
  down: async (db) => {
    // Note: SQLite doesn't support DROP COLUMN, so we can't easily rollback this
    // We would need to recreate the table without the column
    console.log('Warning: Cannot rollback has_new_episode column addition in SQLite');
    return Promise.resolve();
  }
};

module.exports = migration;
