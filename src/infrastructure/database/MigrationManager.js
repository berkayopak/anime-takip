const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Database Migration Manager
 * Manages database schema changes and maintains migration history
 */
class MigrationManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize migration system
   */
  async initialize(db) {
    this.db = db;
    await this.createMigrationsTable();
  }

  /**
   * Create migrations tracking table
   */
  createMigrationsTable() {
    return new Promise((resolve, reject) => {
      const createMigrationsTable = `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT NOT NULL UNIQUE,
          filename TEXT NOT NULL,
          executed_at TEXT NOT NULL,
          checksum TEXT
        )
      `;

      this.db.run(createMigrationsTable, (err) => {
        if (err) {
          console.error('Failed to create migrations table:', err);
          reject(err);
        } else {
          console.log('Migrations table ready');
          resolve();
        }
      });
    });
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      // Get list of executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedVersions = new Set(executedMigrations.map(m => m.version));

      // Get available migration files
      const migrationFiles = this.getMigrationFiles();

      // Run pending migrations in order
      for (const file of migrationFiles) {
        const version = this.extractVersionFromFilename(file);
        
        if (!executedVersions.has(version)) {
          console.log(`Running migration: ${file}`);
          await this.runMigration(file, version);
        } else {
          console.log(`Migration already executed: ${file}`);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations from database
   */
  getExecutedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM migrations ORDER BY version ASC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  /**
   * Get available migration files
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('No migrations directory found');
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort(); // Ensure chronological order
  }

  /**
   * Extract version from migration filename
   */
  extractVersionFromFilename(filename) {
    // Format: 001_initial_schema.js -> 001
    const match = filename.match(/^(\d+)_/);
    return match ? match[1] : filename;
  }

  /**
   * Run a specific migration
   */
  async runMigration(filename, version) {
    try {
      const migrationPath = path.join(this.migrationsPath, filename);
      const migration = require(migrationPath);

      // Run the migration
      await migration.up(this.db);

      // Record migration execution
      await this.recordMigration(version, filename);

      console.log(`Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  /**
   * Record migration execution in database
   */
  recordMigration(version, filename) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      this.db.run(
        'INSERT INTO migrations (version, filename, executed_at) VALUES (?, ?, ?)',
        [version, filename, now],
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
   * Rollback a migration (for future use)
   */
  async rollbackMigration(filename) {
    try {
      const migrationPath = path.join(this.migrationsPath, filename);
      const migration = require(migrationPath);

      if (migration.down) {
        await migration.down(this.db);
        console.log(`Migration ${filename} rolled back successfully`);
      } else {
        throw new Error(`Migration ${filename} does not support rollback`);
      }
    } catch (error) {
      console.error(`Rollback failed for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  isConnected() {
    return this.db !== null;
  }
}

module.exports = MigrationManager;
