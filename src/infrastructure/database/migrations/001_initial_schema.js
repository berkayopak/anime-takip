/**
 * Initial database schema migration
 * Creates all base tables from existing database.js
 */

const migration = {
  version: '001',
  description: 'Initial database schema - anime tracker tables',

  /**
   * Apply migration
   */
  up: async (db) => {
    return new Promise((resolve, reject) => {
      // Create animes table (exact copy from database.js)
      const createAnimesTable = `
        CREATE TABLE IF NOT EXISTS animes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL UNIQUE,
          image TEXT,
          currentEpisode INTEGER DEFAULT 0,
          totalEpisodes INTEGER DEFAULT 0,
          status TEXT DEFAULT 'watching',
          has_new_episode INTEGER DEFAULT 0,
          lastChecked TEXT,
          dateAdded TEXT NOT NULL,
          notes TEXT
        )
      `;

      // Create episodes table (exact copy from database.js)
      const createEpisodesTable = `
        CREATE TABLE IF NOT EXISTS episodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          animeId INTEGER,
          episodeNumber INTEGER,
          watchedDate TEXT,
          rating INTEGER,
          notes TEXT,
          FOREIGN KEY (animeId) REFERENCES animes (id) ON DELETE CASCADE,
          UNIQUE(animeId, episodeNumber)
        )
      `;

      // Create settings table (exact copy from database.js)
      const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;

      // Create categories table (exact copy from database.js)
      const createCategoriesTable = `
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          dateAdded TEXT NOT NULL
        )
      `;

      db.serialize(() => {
        db.run(createAnimesTable, (err) => {
          if (err) {
            console.error('Failed to create animes table:', err);
            reject(err);
            return;
          }
          console.log('✓ Animes table created');
        });

        db.run(createEpisodesTable, (err) => {
          if (err) {
            console.error('Failed to create episodes table:', err);
            reject(err);
            return;
          }
          console.log('✓ Episodes table created');
        });

        db.run(createSettingsTable, (err) => {
          if (err) {
            console.error('Failed to create settings table:', err);
            reject(err);
            return;
          }
          console.log('✓ Settings table created');
        });

        db.run(createCategoriesTable, (err) => {
          if (err) {
            console.error('Failed to create categories table:', err);
            reject(err);
            return;
          }
          console.log('✓ Categories table created');
          
          // Insert default settings (exact copy from database.js)
          db.run(`
            INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('checkInterval', '30'),
            ('notifications', 'true'),
            ('autoRefresh', 'true')
          `, (err) => {
            if (err) {
              console.error('Failed to insert default settings:', err);
              reject(err);
            } else {
              console.log('✓ Default settings inserted');
              resolve();
            }
          });
        });
      });
    });
  },

  /**
   * Rollback migration (for future use)
   */
  down: async (db) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DROP TABLE IF EXISTS categories');
        db.run('DROP TABLE IF EXISTS episodes');
        db.run('DROP TABLE IF EXISTS settings');
        db.run('DROP TABLE IF EXISTS animes', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('All tables dropped');
            resolve();
          }
        });
      });
    });
  }
};

module.exports = migration;
