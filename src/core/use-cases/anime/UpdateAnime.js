const BaseUseCase = require('../BaseUseCase');

/**
 * Update Anime Use Case
 * Handles the business logic for updating anime information
 */
class UpdateAnime extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.eventBus = dependencies.eventBus;
    this.checkSingleAnimeUpdate = dependencies.checkSingleAnimeUpdate;
  }

  /**
   * Execute update anime use case
   * @param {Object} input - Update parameters
   * @param {number} input.animeId - Anime ID to update
   * @param {Object} input.updates - Updates to apply
   * @param {number} input.updates.currentEpisode - New current episode
   * @param {string} input.updates.status - New status
   * @param {number} input.updates.totalEpisodes - New total episodes
   * @param {boolean} input.checkForNewEpisodes - Whether to check for new episodes after update
   * @returns {Promise<Object>} - Update result
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      const { animeId, updates, checkForNewEpisodes = false } = input;
      
      // 1. Update anime data
      const updateResult = await this.performUpdate(animeId, updates);
      
      // 2. Check for new episodes if requested
      if (checkForNewEpisodes) {
        await this.checkForNewEpisodesAfterUpdate(animeId);
      }
      
      // 3. Emit event for UI updates
      this.eventBus.emit('anime-updated', {
        type: 'data-updated',
        animeId,
        updates
      });
      
      return updateResult;
      
    } catch (error) {
      this.handleError(error, 'updateAnime');
    }
  }

  /**
   * Update episode progress
   * @param {Object} input - Episode update parameters
   * @param {number} input.animeId - Anime ID
   * @param {number} input.episode - New current episode
   * @returns {Promise<Object>} - Update result
   */
  async updateEpisode(input) {
    try {
      this.validateEpisodeInput(input);
      
      const { animeId, episode } = input;
      
      // 1. Update episode in repository
      await this.animeRepository.updateEpisode(animeId, episode);
      
      // 2. Clear new episode flag when episode is updated
      await this.animeRepository.updateNewEpisodeStatus(animeId, false);
      
      // 3. Emit event for UI updates
      this.eventBus.emit('anime-episode-updated', {
        animeId,
        episode
      });
      
      return { success: true, animeId, episode };
      
    } catch (error) {
      this.handleError(error, 'updateEpisode');
    }
  }

  /**
   * Update anime status
   * @param {Object} input - Status update parameters
   * @param {number} input.animeId - Anime ID
   * @param {string} input.status - New status
   * @returns {Promise<Object>} - Update result
   */
  async updateStatus(input) {
    try {
      this.validateStatusInput(input);
      
      const { animeId, status } = input;
      
      // 1. Update status in repository
      await this.animeRepository.updateStatus(animeId, status);
      
      // 2. Emit event for UI updates
      this.eventBus.emit('anime-status-updated', {
        animeId,
        status
      });
      
      return { success: true, animeId, status };
      
    } catch (error) {
      this.handleError(error, 'updateStatus');
    }
  }

  /**
   * Validate general update input
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (!input.updates || typeof input.updates !== 'object') {
      throw new Error('Updates object is required');
    }
  }

  /**
   * Validate episode update input
   * @param {Object} input - Input to validate
   */
  validateEpisodeInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (input.episode === null || input.episode === undefined || typeof input.episode !== 'number') {
      throw new Error('Episode is required and must be a number');
    }
    
    if (input.episode < 0) {
      throw new Error('Episode must be non-negative');
    }
  }

  /**
   * Validate status update input
   * @param {Object} input - Input to validate
   */
  validateStatusInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (!input.status || typeof input.status !== 'string') {
      throw new Error('Status is required and must be a string');
    }
    
    const validStatuses = ['watching', 'completed', 'planned', 'paused', 'dropped'];
    if (!validStatuses.includes(input.status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Perform the actual update
   * @param {number} animeId - Anime ID
   * @param {Object} updates - Updates to apply
   */
  async performUpdate(animeId, updates) {
    const validFields = ['currentEpisode', 'totalEpisodes', 'status', 'title', 'image'];
    const filteredUpdates = {};
    
    // Filter out invalid fields
    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key) && value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Update in repository
    await this.animeRepository.update(animeId, filteredUpdates);
    
    return { success: true, animeId, updates: filteredUpdates };
  }

  /**
   * Check for new episodes after update
   * @param {number} animeId - Anime ID
   */
  async checkForNewEpisodesAfterUpdate(animeId) {
    try {
      const updates = await this.checkSingleAnimeUpdate(animeId);
      
      if (updates.length > 0) {
        this.eventBus.emit('anime-updated', {
          type: 'new-episode',
          animeId,
          episodeNumber: updates[0].newEpisode,
          episodeUrl: updates[0].episodeUrl || null
        });
      }
    } catch (error) {
      console.error('Failed to check for new episodes after update:', error);
      // Don't throw error here, update was successful
    }
  }
}

module.exports = UpdateAnime;
