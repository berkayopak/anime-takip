const UserSettingsRepository = require('../../core/repositories/UserSettingsRepository');
const UserSettings = require('../../core/entities/UserSettings');

/**
 * SQLite implementation of UserSettingsRepository
 * Uses exact SQL queries from the original database.js for compatibility
 */
class SqliteUserSettingsRepository extends UserSettingsRepository {
  constructor(dbConnection, errorHandler = null) {
    super(errorHandler);
    this.dbConnection = dbConnection;
  }

  get db() {
    return this.dbConnection.getConnection();
  }

  /**
   * Get setting (exact copy from database.js getSetting method)
   */
  async getSetting(key) {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.value : null);
        }
      });
    });
  }

  /**
   * Set setting (exact copy from database.js setSetting method)
   */
  async setSetting(key, value) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    if (!this.db) {
      return {};
    }

    return new Promise((resolve, reject) => {
      this.db.all('SELECT key, value FROM settings', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = row.value;
          });
          resolve(settings);
        }
      });
    });
  }

  /**
   * Save categories (exact copy from database.js saveCategories method)
   */
  async saveCategories(categories) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      const dateAdded = new Date().toISOString();
      
      this.db.serialize(() => {
        // Clear existing categories
        this.db.run('DELETE FROM categories', (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Insert new categories
          const stmt = this.db.prepare('INSERT INTO categories (name, dateAdded) VALUES (?, ?)');
          
          categories.forEach(category => {
            stmt.run(category, dateAdded);
          });
          
          stmt.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Saved ${categories.length} categories to database`);
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * Get categories (exact copy from database.js getCategories method)
   */
  async getCategories() {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      this.db.all('SELECT name FROM categories ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const categories = rows.map(row => row.name);
          resolve(categories);
        }
      });
    });
  }

  /**
   * Get categories count (exact copy from database.js getCategoriesCount method)
   */
  async getCategoriesCount() {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // BaseRepository interface methods
  async create(entity) {
    throw new Error('Create method not applicable for settings repository');
  }

  async findById(id) {
    throw new Error('FindById method not applicable for settings repository');
  }

  async findAll() {
    return this.getAllSettings();
  }

  async update(key, value) {
    return this.setSetting(key, value);
  }

  async delete(key) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM settings WHERE key = ?', [key], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = SqliteUserSettingsRepository;
