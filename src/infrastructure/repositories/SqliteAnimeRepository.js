const AnimeRepository = require('../../core/repositories/AnimeRepository');
const Anime = require('../../core/entities/Anime');

/**
 * SQLite implementation of AnimeRepository
 * Uses exact SQL queries from the original database.js for compatibility
 */
class SqliteAnimeRepository extends AnimeRepository {
  constructor(dbConnection, errorHandler = null) {
    super(errorHandler);
    this.dbConnection = dbConnection;
  }

  get db() {
    return this.dbConnection.getConnection();
  }

  /**
   * Add new anime to database (exact copy from database.js addAnime method)
   */
  async create(anime) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

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

  /**
   * Get all animes (exact copy from database.js getAnimeList method)
   */
  async findAll() {
    if (!this.db) {
      return [];
    }

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

  /**
   * Get anime by ID (exact copy from database.js getAnimeById method)
   */
  async findById(id) {
    if (!this.db) {
      return null;
    }

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

  /**
   * Get anime by URL (exact copy from database.js getAnimeByUrl method)
   */
  async findByUrl(url) {
    if (!this.db) {
      return null;
    }

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

  /**
   * Update anime (exact copy from database.js updateAnime method)
   */
  async update(id, updates) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

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

  /**
   * Delete anime (exact copy from database.js deleteAnime method)
   */
  async delete(id) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

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

  /**
   * Search anime by title
   */
  async search(query) {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM animes WHERE title LIKE ? ORDER BY title ASC',
        [`%${query}%`],
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

  /**
   * Get anime statistics
   */
  async getStats() {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

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
}

module.exports = SqliteAnimeRepository;
