const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const MigrationManager = require('./MigrationManager');

/**
 * Database Connection Manager
 * Handles database connection, initialization, and basic setup
 * Does NOT contain business logic - pure connection management
 */
class DatabaseConnection {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.migrationManager = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      // Setup database path (exact copy from database.js)
      const isDev = process.env.NODE_ENV === 'development';
      const userDataPath = isDev ? __dirname : app.getPath('userData');
      const dataDir = isDev ? path.join(__dirname, '..', '..', '..', 'data') : path.join(userDataPath, 'data');
      
      this.dbPath = path.join(dataDir, 'anime_tracker.db');

      // Create data directory if it doesn't exist (exact copy from database.js)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath);
      console.log('Database connection established:', this.dbPath);

      // Initialize migration manager
      this.migrationManager = new MigrationManager(this.dbPath);
      await this.migrationManager.initialize(this.db);

      // Run migrations
      await this.migrationManager.runMigrations();

      this.isInitialized = true;
      console.log('Database initialized successfully');
      
      return this.db;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Don't throw error, let the app continue with basic functionality
      // Business logic will handle the missing connection gracefully
      return null;
    }
  }

  /**
   * Get database connection
   */
  getConnection() {
    if (!this.isInitialized || !this.db) {
      console.warn('Database not initialized, returning null connection');
      return null;
    }
    return this.db;
  }

  /**
   * Check if database is connected and ready
   */
  isConnected() {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null;
          this.isInitialized = false;
          resolve();
        }
      });
    });
  }

  /**
   * Execute raw SQL query (for migrations only)
   */
  executeRaw(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            lastID: this.lastID, 
            changes: this.changes 
          });
        }
      });
    });
  }

  /**
   * Execute SELECT query (for migrations only)
   */
  queryRaw(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get single row (for migrations only)
   */
  getRowRaw(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Begin transaction
   */
  beginTransaction() {
    return this.executeRaw('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  commitTransaction() {
    return this.executeRaw('COMMIT');
  }

  /**
   * Rollback transaction
   */
  rollbackTransaction() {
    return this.executeRaw('ROLLBACK');
  }

  /**
   * Get database path
   */
  getDatabasePath() {
    return this.dbPath;
  }

  /**
   * Get migration manager
   */
  getMigrationManager() {
    return this.migrationManager;
  }
}

module.exports = DatabaseConnection;
