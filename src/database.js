const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Database {
  constructor() {
    // Use user data directory for production builds to avoid permission issues
    const isDev = process.env.NODE_ENV === 'development';
    const userDataPath = isDev ? __dirname : app.getPath('userData');
    const dataDir = isDev ? path.join(__dirname, '..', 'data') : path.join(userDataPath, 'data');
    
    this.dbPath = path.join(dataDir, 'anime_tracker.db');
    this.db = null;
  }

  async initialize() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath);
      
      // Create tables
      await this.createTables();
      
      // Run migrations
      await this.runMigrations();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Don't throw error, let the app continue with basic functionality
      // Database operations will handle the missing connection gracefully
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
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

      const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `;

      const createCategoriesTable = `
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          dateAdded TEXT NOT NULL
        )
      `;

      this.db.serialize(() => {
        this.db.run(createAnimesTable, (err) => {
          if (err) {
            console.error('Failed to create animes table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createEpisodesTable, (err) => {
          if (err) {
            console.error('Failed to create episodes table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createSettingsTable, (err) => {
          if (err) {
            console.error('Failed to create settings table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createCategoriesTable, (err) => {
          if (err) {
            console.error('Failed to create categories table:', err);
            reject(err);
            return;
          }
          
          // Insert default settings
          this.db.run(`
            INSERT OR IGNORE INTO settings (key, value) VALUES 
            ('checkInterval', '30'),
            ('notifications', 'true'),
            ('autoRefresh', 'true')
          `, (err) => {
            if (err) {
              console.error('Failed to insert default settings:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  async runMigrations() {
    return new Promise((resolve, reject) => {
      // Check if column exists first
      this.db.all("PRAGMA table_info(animes)", (err, columns) => {
        if (err) {
          console.error('Failed to check table structure:', err);
          reject(err);
          return;
        }
        
        const hasNewEpisodeColumn = columns.some(col => col.name === 'has_new_episode');
        
        if (!hasNewEpisodeColumn) {
          // Add has_new_episode column if it doesn't exist
          this.db.run(`
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
  }

  async addAnime(anime) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO animes (title, url, image, currentEpisode, totalEpisodes, status, has_new_episode, lastChecked, dateAdded, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        anime.title,
        anime.url,
        anime.image,
        anime.currentEpisode || 0,
        anime.totalEpisodes || 0,
        anime.status || 'watching',
        anime.has_new_episode || 0,
        anime.lastChecked,
        anime.dateAdded,
        anime.notes || ''
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...anime });
        }
      });

      stmt.finalize();
    });
  }

  async getAnimeList() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM animes ORDER BY has_new_episode DESC, title ASC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAnimeById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM animes WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getAnimeByUrl(url) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM animes WHERE url = ?', [url], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateEpisode(animeId, episode) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE animes SET currentEpisode = ? WHERE id = ?',
        [episode, animeId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async updateAnimeStatus(animeId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE animes SET status = ? WHERE id = ?',
        [status, animeId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async updateAnime(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      this.db.run(
        `UPDATE animes SET ${setClause} WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async updateLastChecked(animeId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE animes SET lastChecked = ? WHERE id = ?',
        [new Date().toISOString(), animeId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async updateNewEpisodeStatus(animeId, hasNewEpisode) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE animes SET has_new_episode = ? WHERE id = ?',
        [hasNewEpisode ? 1 : 0, animeId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async getAnimesWithoutNewEpisodes() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM animes WHERE has_new_episode = 0 ORDER BY has_new_episode DESC, title ASC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async deleteAnime(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM animes WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async addEpisodeRecord(animeId, episodeNumber, rating = null, notes = '') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO episodes (animeId, episodeNumber, watchedDate, rating, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        animeId,
        episodeNumber,
        new Date().toISOString(),
        rating,
        notes
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });

      stmt.finalize();
    });
  }

  async getEpisodeRecords(animeId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM episodes WHERE animeId = ? ORDER BY episodeNumber ASC',
        [animeId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async getSetting(key) {
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

  async setSetting(key, value) {
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

  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total FROM animes',
        'SELECT COUNT(*) as watching FROM animes WHERE status = "watching"',
        'SELECT COUNT(*) as completed FROM animes WHERE status = "completed"',
        'SELECT COUNT(*) as paused FROM animes WHERE status = "paused"',
        'SELECT SUM(currentEpisode) as totalWatched FROM animes'
      ];

      Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
          this.db.get(query, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      )).then(results => {
        resolve({
          total: results[0].total,
          watching: results[1].watching,
          completed: results[2].completed,
          paused: results[3].paused,
          totalWatched: results[4].totalWatched || 0
        });
      }).catch(reject);
    });
  }

  // Categories methods
  async saveCategories(categories) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

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

  async getCategories() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

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

  async getCategoriesCount() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async setNewEpisodeFlag(animeId, hasNewEpisode) {
    return new Promise((resolve, reject) => {
      const flag = hasNewEpisode ? 1 : 0;
      this.db.run(
        'UPDATE animes SET has_new_episode = ? WHERE id = ?',
        [flag, animeId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`Set new episode flag for anime ${animeId}: ${hasNewEpisode}`);
            resolve(this.changes);
          }
        }
      );
    });
  }
}

module.exports = Database;
