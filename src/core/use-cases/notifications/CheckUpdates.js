const BaseUseCase = require('../BaseUseCase');

/**
 * Check Updates Use Case
 * Handles the business logic for checking anime updates and showing notifications
 */
class CheckUpdates extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.episodeRepository = dependencies.episodeRepository;
    this.scrapingService = dependencies.scrapingService;
    this.showNotificationUseCase = dependencies.showNotificationUseCase;
    this.eventBus = dependencies.eventBus;
  }

  /**
   * Execute check updates use case
   * @param {Object} input - Check updates options
   * @param {boolean} input.showNotifications - Whether to show notifications (default: true)
   * @param {boolean} input.silent - Whether to run silently (default: false)
   * @param {Array} input.animeIds - Specific anime IDs to check (optional)
   * @returns {Promise<Object>} - Update results
   */
  async execute(input = {}) {
    try {
      this.validateInput(input);
      
      const options = {
        showNotifications: input.showNotifications !== false,
        silent: input.silent || false,
        animeIds: input.animeIds || null
      };
      
      // 1. Get anime list to check
      const animeList = await this.getAnimeToCheck(options.animeIds);
      
      if (animeList.length === 0) {
        return { totalChecked: 0, updatesFound: 0, updates: [] };
      }
      
      // 2. Check each anime for updates
      const results = await this.checkAnimeUpdates(animeList, options);
      
      // 3. Show summary notification if not silent
      if (!options.silent && options.showNotifications && results.updatesFound > 0) {
        await this.showUpdateSummaryNotification(results);
      }
      
      // 4. Emit event for UI updates
      this.eventBus.emit('updates-checked', results);
      
      return results;
      
    } catch (error) {
      this.handleError(error, 'checkUpdates');
    }
  }

  /**
   * Validate input for checking updates
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    if (!input || typeof input !== 'object') {
      return; // Input is optional
    }
    
    if (input.animeIds && !Array.isArray(input.animeIds)) {
      throw new Error('animeIds must be an array');
    }
    
    if (input.showNotifications !== undefined && typeof input.showNotifications !== 'boolean') {
      throw new Error('showNotifications must be a boolean');
    }
    
    if (input.silent !== undefined && typeof input.silent !== 'boolean') {
      throw new Error('silent must be a boolean');
    }
  }

  /**
   * Get anime list to check for updates
   * @param {Array} animeIds - Specific anime IDs (optional)
   * @returns {Promise<Array>} - Anime list
   */
  async getAnimeToCheck(animeIds) {
    if (animeIds && animeIds.length > 0) {
      // Check specific anime
      const animeList = [];
      for (const id of animeIds) {
        const anime = await this.animeRepository.findById(id);
        if (anime) {
          animeList.push(anime);
        }
      }
      return animeList;
    } else {
      // Check all anime
      return await this.animeRepository.findAll();
    }
  }

  /**
   * Check updates for anime list
   * @param {Array} animeList - List of anime to check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} - Check results
   */
  async checkAnimeUpdates(animeList, options) {
    const results = {
      totalChecked: animeList.length,
      updatesFound: 0,
      updates: [],
      errors: []
    };

    for (const anime of animeList) {
      try {
        const updates = await this.checkSingleAnimeUpdate(anime, options);
        if (updates.length > 0) {
          results.updatesFound += updates.length;
          results.updates.push(...updates);
        }
      } catch (error) {
        console.error(`Error checking updates for ${anime.title}:`, error);
        results.errors.push({
          animeId: anime.id,
          animeTitle: anime.title,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Check updates for single anime
   * @param {Object} anime - Anime to check
   * @param {Object} options - Check options
   * @returns {Promise<Array>} - Updates found
   */
  async checkSingleAnimeUpdate(anime, options) {
    const updates = [];
    
    try {
      // Get episode list from scraping service
      const episodeData = await this.scrapingService.getEpisodeList(anime.url);
      
      if (!episodeData || !episodeData.episodes) {
        return updates;
      }

      // Check for new episodes
      for (const episodeInfo of episodeData.episodes) {
        const episodeNumber = parseInt(episodeInfo.episode);
        
        // Check if episode exists in database
        const existingEpisode = await this.episodeRepository.findByAnimeAndEpisode(anime.id, episodeNumber);
        
        if (!existingEpisode) {
          // New episode found
          const newEpisode = {
            animeId: anime.id,
            episodeNumber: episodeNumber,
            title: episodeInfo.title || `Episode ${episodeNumber}`,
            url: episodeInfo.url,
            releaseDate: new Date().toISOString(),
            watched: false
          };
          
          // Save new episode
          await this.episodeRepository.create(newEpisode);
          
          updates.push({
            animeId: anime.id,
            animeTitle: anime.title,
            newEpisode: episodeNumber,
            episodeTitle: newEpisode.title,
            episodeUrl: newEpisode.url
          });
          
          // Show individual notification if enabled
          if (options.showNotifications && !options.silent) {
            await this.showNewEpisodeNotification(anime, newEpisode);
          }
        }
      }
      
      // Update anime's last checked time
      await this.animeRepository.update(anime.id, {
        lastChecked: new Date().toISOString(),
        totalEpisodes: episodeData.episodes.length
      });
      
    } catch (error) {
      console.error(`Error checking ${anime.title}:`, error);
      throw error;
    }
    
    return updates;
  }

  /**
   * Show new episode notification
   * @param {Object} anime - Anime object
   * @param {Object} episode - Episode object
   */
  async showNewEpisodeNotification(anime, episode) {
    try {
      await this.showNotificationUseCase.execute({
        type: 'new-episode',
        title: `New Episode Available!`,
        message: `${anime.title} - Episode ${episode.episodeNumber}`,
        data: {
          animeId: anime.id,
          episodeNumber: episode.episodeNumber,
          episodeUrl: episode.url
        }
      });
    } catch (error) {
      console.error('Failed to show new episode notification:', error);
    }
  }

  /**
   * Show update summary notification
   * @param {Object} results - Update results
   */
  async showUpdateSummaryNotification(results) {
    try {
      const message = results.updatesFound === 1 
        ? '1 new episode found!'
        : `${results.updatesFound} new episodes found!`;
      
      await this.showNotificationUseCase.execute({
        type: 'update-complete',
        title: 'Update Check Complete',
        message: message,
        data: {
          totalChecked: results.totalChecked,
          updatesFound: results.updatesFound
        }
      });
    } catch (error) {
      console.error('Failed to show update summary notification:', error);
    }
  }
}

module.exports = CheckUpdates;
