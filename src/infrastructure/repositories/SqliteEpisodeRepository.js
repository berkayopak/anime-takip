const EpisodeRepository = require('../../core/repositories/EpisodeRepository');
const Episode = require('../../core/entities/Episode');

/**
 * SQLite implementation of EpisodeRepository
 * Uses exact SQL queries from the original database.js for compatibility
 */
class SqliteEpisodeRepository extends EpisodeRepository {
  constructor(dbConnection, errorHandler = null) {
    super(errorHandler);
    this.dbConnection = dbConnection;
  }

  get db() {
    return this.dbConnection.getConnection();
  }

  /**
   * Add episode record (exact copy from database.js addEpisodeRecord method)
   */
  async addEpisodeRecord(animeId, episodeNumber, rating = null, notes = '') {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

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

  /**
   * Get episode records for an anime (exact copy from database.js getEpisodeRecords method)
   */
  async getEpisodeRecords(animeId) {
    if (!this.db) {
      return [];
    }

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

  /**
   * Create episode record (alias for addEpisodeRecord)
   */
  async create(episode) {
    return this.addEpisodeRecord(
      episode.animeId,
      episode.episodeNumber,
      episode.rating,
      episode.notes
    );
  }

  /**
   * Find episodes by anime ID
   */
  async findByAnimeId(animeId) {
    return this.getEpisodeRecords(animeId);
  }

  /**
   * Find episode by anime ID and episode number
   */
  async findByAnimeAndEpisode(animeId, episodeNumber) {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM episodes WHERE animeId = ? AND episodeNumber = ?',
        [animeId, episodeNumber],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Update episode record
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
        `UPDATE episodes SET ${setClause} WHERE id = ?`,
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
   * Delete episode record
   */
  async delete(id) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM episodes WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  /**
   * Delete all episodes for an anime
   */
  async deleteByAnimeId(animeId) {
    if (!this.db) {
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM episodes WHERE animeId = ?', [animeId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  /**
   * Get episode count for an anime
   */
  async getEpisodeCount(animeId) {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM episodes WHERE animeId = ?',
        [animeId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });
  }

  /**
   * Get latest watched episode for an anime
   */
  async getLatestWatchedEpisode(animeId) {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM episodes WHERE animeId = ? ORDER BY episodeNumber DESC LIMIT 1',
        [animeId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Mark episode as watched
   */
  async markAsWatched(animeId, episodeNumber, rating = null, notes = '') {
    return this.addEpisodeRecord(animeId, episodeNumber, rating, notes);
  }
}

module.exports = SqliteEpisodeRepository;
