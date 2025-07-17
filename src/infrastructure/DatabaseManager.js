const DatabaseConnection = require('./database/DatabaseConnection');
const SqliteAnimeRepository = require('./repositories/SqliteAnimeRepository');
const SqliteEpisodeRepository = require('./repositories/SqliteEpisodeRepository');
const SqliteUserSettingsRepository = require('./repositories/SqliteUserSettingsRepository');

/**
 * Database Manager
 * Manages database connection and provides repository instances
 * Replaces the old database.js with clean architecture
 */
class DatabaseManager {
  constructor() {
    this.dbConnection = null;
    this.animeRepository = null;
    this.episodeRepository = null;
    this.userSettingsRepository = null;
    // this.errorHandler kaldırıldı, errorHandler sadece initialize parametresiyle geçilecek
    this.isInitialized = false;
  }



  /**
   * Initialize database and repositories
   */
  async initialize(errorHandler = null) {
    try {
      // Initialize database connection
      this.dbConnection = new DatabaseConnection();
      await this.dbConnection.initialize();

      // Initialize repositories with database connection and error handler
      this.animeRepository = new SqliteAnimeRepository(this.dbConnection, errorHandler);
      this.episodeRepository = new SqliteEpisodeRepository(this.dbConnection, errorHandler);
      this.userSettingsRepository = new SqliteUserSettingsRepository(this.dbConnection, errorHandler);

      this.isInitialized = true;
      console.log('DatabaseManager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('DatabaseManager initialization failed:', error);
      // Don't throw error, let the app continue with basic functionality
      return false;
    }
  }

  /**
   * Get anime repository
   */
  getAnimeRepository() {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager not initialized');
    }
    return this.animeRepository;
  }

  /**
   * Get episode repository
   */
  getEpisodeRepository() {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager not initialized');
    }
    return this.episodeRepository;
  }

  /**
   * Get user settings repository
   */
  getUserSettingsRepository() {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager not initialized');
    }
    return this.userSettingsRepository;
  }

  /**
   * Get database connection (for migration or advanced usage)
   */
  getDatabaseConnection() {
    return this.dbConnection;
  }

  /**
   * Check if database is ready
   */
  isReady() {
    return this.isInitialized && this.dbConnection && this.dbConnection.isConnected();
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.dbConnection) {
        await this.dbConnection.close();
      }
      
      this.animeRepository = null;
      this.episodeRepository = null;
      this.userSettingsRepository = null;
      this.isInitialized = false;
      
      console.log('DatabaseManager closed');
    } catch (error) {
      console.error('Error closing DatabaseManager:', error);
      throw error;
    }
  }

  /**
   * Get migration manager (for advanced usage)
   */
  getMigrationManager() {
    if (!this.dbConnection) {
      throw new Error('Database connection not initialized');
    }
    return this.dbConnection.getMigrationManager();
  }

  /**
   * Run migrations manually (if needed)
   */
  async runMigrations() {
    if (!this.dbConnection) {
      throw new Error('Database connection not initialized');
    }
    
    const migrationManager = this.dbConnection.getMigrationManager();
    await migrationManager.runMigrations();
  }
}

module.exports = DatabaseManager;
