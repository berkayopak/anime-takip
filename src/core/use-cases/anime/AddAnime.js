const BaseUseCase = require('../BaseUseCase');

/**
 * Add Anime Use Case
 * Handles the business logic for adding a new anime to the tracking list
 */
class AddAnime extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.scrapingService = dependencies.scrapingService;
    this.notificationService = dependencies.notificationService;
    this.eventBus = dependencies.eventBus;
    this.checkSingleAnimeUpdate = dependencies.checkSingleAnimeUpdate;
  }

  /**
   * Execute add anime use case
   * @param {Object} input - Anime data to add
   * @param {string} input.title - Anime title
   * @param {string} input.url - Anime URL
   * @param {number} input.currentEpisode - Current episode (optional)
   * @returns {Promise<Object>} - Added anime data
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      // 1. Get anime details from scraping service
      const details = await this.scrapingService.getAnimeDetails(input.url);
      
      // 2. Prepare anime entity
      const anime = {
        title: input.title,
        url: input.url,
        image: details.image,
        currentEpisode: input.currentEpisode || 0,
        totalEpisodes: details.totalEpisodes || 0,
        status: 'watching',
        lastChecked: new Date().toISOString(),
        dateAdded: new Date().toISOString()
      };

      // 3. Save anime to repository
      const result = await this.animeRepository.create(anime);
      
      // 4. Check for new episodes immediately after adding
      await this.checkForNewEpisodesAfterAdding(anime);
      
      // 5. Emit event for UI updates
      this.eventBus.emit('anime-added', { anime: result });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'addAnime');
    }
  }

  /**
   * Validate input for adding anime
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.title || typeof input.title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    if (!input.url || typeof input.url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    
    if (!input.url.includes('turkanime.co')) {
      throw new Error('URL must be a valid TurkAnime.co URL');
    }
    
    if (input.currentEpisode && (typeof input.currentEpisode !== 'number' || input.currentEpisode < 0)) {
      throw new Error('Current episode must be a non-negative number');
    }
  }

  /**
   * Check for new episodes after adding anime
   * @param {Object} anime - Added anime data
   */
  async checkForNewEpisodesAfterAdding(anime) {
    try {
      // Get the newly added anime from database
      const addedAnime = await this.animeRepository.findByUrl(anime.url);
      if (!addedAnime) return;
      
      // Check for updates
      const updates = await this.checkSingleAnimeUpdate(addedAnime.id);
      
      if (updates.length > 0) {
        // Show notification if available
        await this.notificationService.showNewAnimeNotification(
          anime.title,
          updates[0].newEpisode
        );
        
        // Emit event for UI updates
        this.eventBus.emit('anime-updated', {
          type: 'new-episode',
          animeId: addedAnime.id,
          episodeNumber: updates[0].newEpisode,
          episodeUrl: updates[0].episodeUrl || null
        });
      }
    } catch (error) {
      console.error('Failed to check for new episodes after adding anime:', error);
      // Don't throw error here, anime was successfully added
    }
  }
}

module.exports = AddAnime;
