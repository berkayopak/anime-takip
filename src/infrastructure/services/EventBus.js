const { EventEmitter } = require('events');

/**
 * Event Bus Service
 * Handles application-wide event communication
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    
    // Set max listeners to avoid warnings
    this.setMaxListeners(50);
  }

  /**
   * Initialize the event bus
   */
  async initialize() {
    try {
      this.isInitialized = true;
      console.log('📡 Event Bus initialized');
      
      // Setup default event handlers
      this.setupDefaultHandlers();
      
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Event Bus:', error);
      throw error;
    }
  }

  /**
   * Setup default event handlers
   */
  setupDefaultHandlers() {
    // Log all events in development
    if (process.env.NODE_ENV === 'development') {
      this.onAny((eventName, data) => {
        console.log(`📡 Event: ${eventName}`, data);
      });
    }
    
    // Handle errors
    this.on('error', (error) => {
      console.error('📡 Event Bus Error:', error);
    });
  }

  /**
   * Listen to all events (for debugging)
   * @param {Function} callback - Callback function
   */
  onAny(callback) {
    const originalEmit = this.emit;
    this.emit = function(eventName, ...args) {
      callback(eventName, ...args);
      return originalEmit.apply(this, arguments);
    };
  }

  /**
   * Emit anime-related events
   */
  emitAnimeAdded(anime) {
    this.emit('anime-added', { anime });
  }

  emitAnimeUpdated(animeId, updateData) {
    this.emit('anime-updated', { animeId, ...updateData });
  }

  emitAnimeDeleted(animeId) {
    this.emit('anime-deleted', { animeId });
  }

  /**
   * Emit episode-related events
   */
  emitEpisodeWatched(episodeId, animeId) {
    this.emit('episode-watched', { episodeId, animeId });
  }

  emitEpisodesSynced(animeId, episodeCount) {
    this.emit('episodes-synced', { animeId, episodeCount });
  }

  /**
   * Emit update-related events
   */
  emitUpdatesStarted() {
    this.emit('updates-started');
  }

  emitUpdatesCompleted(results) {
    this.emit('updates-completed', results);
  }

  emitUpdateProgress(progress) {
    this.emit('update-progress', progress);
  }

  /**
   * Emit notification-related events
   */
  emitNotificationShown(type, data) {
    this.emit('notification-shown', { type, ...data });
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      this.removeAllListeners();
      this.isInitialized = false;
      console.log('📡 Event Bus cleaned up');
    } catch (error) {
      console.error('Error cleaning up Event Bus:', error);
    }
  }
}

module.exports = EventBus;
