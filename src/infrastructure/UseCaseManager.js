/**
 * Use Case Manager
 * Manages dependency injection and initialization of use cases
 */

const UseCases = require('../core/use-cases');
const DatabaseManager = require('./DatabaseManager');
const ScrapingService = require('./services/ScrapingService');
const NotificationService = require('./services/NotificationService');
const EventBus = require('./services/EventBus');
const ErrorHandler = require('../shared/errors/ErrorHandler');

class UseCaseManager {
  constructor(mainWindow = null) {
    this.mainWindow = mainWindow;
    this.isInitialized = false;
    
    // Core dependencies
    this.databaseManager = null;
    this.scrapingService = null;
    this.notificationService = null;
    this.eventBus = null;
    this.errorHandler = null;
    
    // Use cases
    this.useCases = {};
  }

  /**
   * Initialize all dependencies and use cases
   */
  async initialize() {
    try {
      // 1. Initialize core dependencies
      await this.initializeDependencies();
      
      // 2. Initialize use cases with dependencies
      await this.initializeUseCases();
      
      this.isInitialized = true;
      console.log('✅ Use Case Manager initialized successfully');
      
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Use Case Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize core dependencies
   */
  async initializeDependencies() {
    // Event Bus
    this.eventBus = new EventBus();

    // Error Handler (needs EventBus)
    this.errorHandler = new ErrorHandler(this.eventBus);

    // Database Manager
    this.databaseManager = new DatabaseManager();
    await this.databaseManager.initialize(this.errorHandler);

    // Scraping Service
    this.scrapingService = new ScrapingService();
    await this.scrapingService.initialize();

    // Notification Service
    this.notificationService = new NotificationService(this.mainWindow);
    await this.notificationService.initialize();
  }

  /**
   * Initialize use cases with dependency injection
   */
  async initializeUseCases() {
    const dependencies = this.createDependencies();
    
    // First, initialize notification use cases
    this.useCases.showNotification = new UseCases.ShowNotification(dependencies);
    
    // Then create dependencies with showNotificationUseCase
    const extendedDependencies = {
      ...dependencies,
      showNotificationUseCase: this.useCases.showNotification
    };
    
    // Anime use cases
    this.useCases.addAnime = new UseCases.AddAnime(extendedDependencies);
    this.useCases.searchAnime = new UseCases.SearchAnime(extendedDependencies);
    this.useCases.updateAnime = new UseCases.UpdateAnime(extendedDependencies);
    this.useCases.deleteAnime = new UseCases.DeleteAnime(extendedDependencies);
    
    // Episode use cases
    this.useCases.markWatched = new UseCases.MarkWatched(extendedDependencies);
    this.useCases.syncEpisodes = new UseCases.SyncEpisodes(extendedDependencies);
    
    // CheckUpdates use case with showNotificationUseCase
    this.useCases.checkUpdates = new UseCases.CheckUpdates(extendedDependencies);
    
    console.log('📦 Use cases initialized:', Object.keys(this.useCases));
  }

  /**
   * Create dependency object for use cases
   */
  createDependencies() {
    return {
      // Repositories
      animeRepository: this.databaseManager.getAnimeRepository(),
      episodeRepository: this.databaseManager.getEpisodeRepository(),
      userSettingsRepository: this.databaseManager.getUserSettingsRepository(),
      
      // Services
      scrapingService: this.scrapingService,
      notificationService: this.notificationService,
      eventBus: this.eventBus,
      errorHandler: this.errorHandler,
      
      // Legacy methods (for gradual migration)
      checkSingleAnimeUpdate: (animeId) => this.checkSingleAnimeUpdateLegacy(animeId)
    };
  }

  /**
   * Get specific use case
   * @param {string} name - Use case name
   * @returns {Object} - Use case instance
   */
  getUseCase(name) {
    if (!this.isInitialized) {
      throw new Error('Use Case Manager not initialized');
    }
    
    if (!this.useCases[name]) {
      throw new Error(`Use case '${name}' not found`);
    }
    
    return this.useCases[name];
  }

  /**
   * Get all use cases
   * @returns {Object} - All use case instances
   */
  getAllUseCases() {
    if (!this.isInitialized) {
      throw new Error('Use Case Manager not initialized');
    }
    
    return { ...this.useCases };
  }

  /**
   * Legacy method for backwards compatibility
   * This will be removed once all code is migrated to use cases
   */
  async checkSingleAnimeUpdateLegacy(animeId) {
    // This is a temporary bridge method
    // TODO: Remove this once AddAnime use case is fully independent
    console.warn('Using legacy checkSingleAnimeUpdate - should migrate to CheckUpdates use case');
    return [];
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.scrapingService) {
        await this.scrapingService.cleanup();
      }
      
      if (this.notificationService) {
        await this.notificationService.cleanup();
      }

      if (this.eventBus) {
        await this.eventBus.cleanup();
      }
      
      if (this.databaseManager) {
        await this.databaseManager.close();
      }
      
      this.isInitialized = false;
      console.log('✅ Use Case Manager cleaned up');
      
    } catch (error) {
      console.error('❌ Error during Use Case Manager cleanup:', error);
    }
  }
}

module.exports = UseCaseManager;
