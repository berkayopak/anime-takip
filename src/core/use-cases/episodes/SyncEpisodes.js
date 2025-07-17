const BaseUseCase = require('../BaseUseCase');

/**
 * Sync Episodes Use Case
 * Handles the business logic for checking and syncing new episodes for all anime
 */
class SyncEpisodes extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.scrapingService = dependencies.scrapingService;
    this.notificationService = dependencies.notificationService;
    this.eventBus = dependencies.eventBus;
    this.isChecking = false;
  }

  /**
   * Execute sync episodes use case
   * @param {Object} input - Sync parameters
   * @param {Array} input.animeIds - Specific anime IDs to check (optional, defaults to all)
   * @param {boolean} input.notifyOnUpdates - Whether to send notifications for updates
   * @param {boolean} input.skipCompleted - Whether to skip completed anime
   * @returns {Promise<Object>} - Sync result with updates found
   */
  async execute(input = {}) {
    try {
      // Prevent concurrent checking
      if (this.isChecking) {
        return { success: false, message: 'Sync already in progress' };
      }
      
      this.isChecking = true;
      this.validateInput(input);
      
      const { 
        animeIds = null, 
        notifyOnUpdates = true, 
        skipCompleted = true 
      } = input;
      
      // 1. Get anime list to check
      const animesToCheck = await this.getAnimesToCheck(animeIds, skipCompleted);
      
      if (animesToCheck.length === 0) {
        return { success: true, updates: [], message: 'No anime to check' };
      }
      
      // 2. Check each anime for new episodes
      const updates = await this.checkAnimesForUpdates(animesToCheck);
      
      // 3. Send notifications if enabled and updates found
      if (notifyOnUpdates && updates.length > 0) {
        await this.sendUpdateNotifications(updates);
      }
      
      // 4. Emit event for UI updates
      this.eventBus.emit('episodes-synced', {
        totalChecked: animesToCheck.length,
        updates,
        hasUpdates: updates.length > 0
      });
      
      return {
        success: true,
        totalChecked: animesToCheck.length,
        updates,
        hasUpdates: updates.length > 0
      };
      
    } catch (error) {
      this.handleError(error, 'syncEpisodes');
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check single anime for updates
   * @param {Object} input - Single anime check parameters
   * @param {number} input.animeId - Anime ID to check
   * @returns {Promise<Object>} - Check result
   */
  async checkSingleAnime(input) {
    try {
      this.validateSingleInput(input);
      
      const { animeId } = input;
      
      // 1. Get anime data
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // 2. Check for updates
      const updates = await this.checkAnimesForUpdates([anime]);
      
      // 3. Emit event for UI updates
      this.eventBus.emit('single-anime-synced', {
        animeId,
        updates,
        hasUpdates: updates.length > 0
      });
      
      return {
        success: true,
        animeId,
        updates,
        hasUpdates: updates.length > 0
      };
      
    } catch (error) {
      this.handleError(error, 'checkSingleAnime');
    }
  }

  /**
   * Validate sync input
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    if (input.animeIds && !Array.isArray(input.animeIds)) {
      throw new Error('animeIds must be an array if provided');
    }
    
    if (input.animeIds && input.animeIds.length > 0) {
      for (const id of input.animeIds) {
        if (typeof id !== 'number' || id <= 0) {
          throw new Error('All anime IDs must be positive numbers');
        }
      }
    }
    
    if (input.notifyOnUpdates !== undefined && typeof input.notifyOnUpdates !== 'boolean') {
      throw new Error('notifyOnUpdates must be a boolean if provided');
    }
    
    if (input.skipCompleted !== undefined && typeof input.skipCompleted !== 'boolean') {
      throw new Error('skipCompleted must be a boolean if provided');
    }
  }

  /**
   * Validate single anime input
   * @param {Object} input - Input to validate
   */
  validateSingleInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (input.animeId <= 0) {
      throw new Error('Anime ID must be a positive number');
    }
  }

  /**
   * Get list of anime to check for updates
   * @param {Array|null} animeIds - Specific anime IDs or null for all
   * @param {boolean} skipCompleted - Whether to skip completed anime
   * @returns {Promise<Array>} - Anime list to check
   */
  async getAnimesToCheck(animeIds, skipCompleted) {
    if (animeIds && animeIds.length > 0) {
      // Check specific anime IDs
      const animes = [];
      for (const id of animeIds) {
        const anime = await this.animeRepository.findById(id);
        if (anime) {
          animes.push(anime);
        }
      }
      return animes;
    } else {
      // Get all anime without new episodes (not already flagged)
      if (skipCompleted) {
        return await this.animeRepository.findAnimesWithoutNewEpisodes();
      } else {
        return await this.animeRepository.findAll();
      }
    }
  }

  /**
   * Check multiple anime for updates
   * @param {Array} animes - Anime list to check
   * @returns {Promise<Array>} - Updates found
   */
  async checkAnimesForUpdates(animes) {
    const updates = [];
    
    for (const anime of animes) {
      try {
        // Skip if already completed
        if (anime.totalEpisodes > 0 && anime.currentEpisode >= anime.totalEpisodes) {
          continue;
        }
        
        // Check for next episode
        const nextEpisode = anime.currentEpisode + 1;
        const episodeResult = await this.scrapingService.checkEpisodeExists(
          anime.url, 
          nextEpisode, 
          anime.totalEpisodes
        );
        
        if (episodeResult.found) {
          // Update has_new_episode flag in database
          await this.animeRepository.updateNewEpisodeStatus(anime.id, true);
          
          updates.push({
            anime: anime,
            newEpisode: nextEpisode,
            episodeUrl: episodeResult.url
          });
        } else {
          // Try fallback method: check anime page for latest episodes
          const latestEpisode = await this.scrapingService.getLatestEpisode(anime.url);
          
          if (latestEpisode && latestEpisode > anime.currentEpisode) {
            // Only accept if it's a reasonable increase (not jumping too much)
            const episodeDiff = latestEpisode - anime.currentEpisode;
            if (episodeDiff <= 5) { // Maximum 5 episodes jump
              // Update has_new_episode flag in database
              await this.animeRepository.updateNewEpisodeStatus(anime.id, true);
              
              const episodeUrl = await this.scrapingService.buildEpisodeUrl(anime.url, latestEpisode);
              
              updates.push({
                anime: anime,
                newEpisode: latestEpisode,
                episodeUrl: episodeUrl
              });
            }
          }
        }
        
        // Update last checked time
        await this.animeRepository.updateLastChecked(anime.id);
        
      } catch (error) {
        console.error(`Failed to check ${anime.title}:`, error);
        continue; // Continue with other anime
      }
    }
    
    return updates;
  }

  /**
   * Send notifications for updates
   * @param {Array} updates - Updates to notify about
   */
  async sendUpdateNotifications(updates) {
    try {
      if (updates.length === 1) {
        // Single update notification
        await this.notificationService.showNewEpisodeNotification(
          updates[0].anime.title,
          updates[0].newEpisode
        );
      } else {
        // Multiple updates notification
        await this.notificationService.showMultipleUpdatesNotification(
          updates.length
        );
      }
    } catch (error) {
      console.error('Failed to send update notifications:', error);
      // Don't throw error here, sync was successful
    }
  }

  /**
   * Get sync status
   * @returns {Object} - Current sync status
   */
  getSyncStatus() {
    return {
      isChecking: this.isChecking,
      lastCheck: this.lastCheck || null
    };
  }
}

module.exports = SyncEpisodes;
