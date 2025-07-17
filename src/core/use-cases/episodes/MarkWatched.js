const BaseUseCase = require('../BaseUseCase');

/**
 * Mark Episode Watched Use Case
 * Handles the business logic for marking episodes as watched
 */
class MarkWatched extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.episodeRepository = dependencies.episodeRepository;
    this.eventBus = dependencies.eventBus;
  }

  /**
   * Execute mark episode watched use case
   * @param {Object} input - Episode marking parameters
   * @param {number} input.animeId - Anime ID
   * @param {number} input.episodeNumber - Episode number to mark as watched
   * @param {number} input.rating - Episode rating (1-10, optional)
   * @param {string} input.notes - Episode notes (optional)
   * @returns {Promise<Object>} - Mark watched result
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      const { animeId, episodeNumber, rating, notes } = input;
      
      // 1. Verify anime exists
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // 2. Update current episode in anime record
      await this.animeRepository.updateEpisode(animeId, episodeNumber);
      
      // 3. Clear new episode flag
      await this.animeRepository.updateNewEpisodeStatus(animeId, false);
      
      // 4. Add episode record if episode repository is available
      let episodeRecord = null;
      if (this.episodeRepository) {
        episodeRecord = await this.episodeRepository.addEpisodeRecord(
          animeId, 
          episodeNumber, 
          rating, 
          notes
        );
      }
      
      // 5. Check if anime should be marked as completed
      const shouldMarkCompleted = await this.checkIfAnimeCompleted(anime, episodeNumber);
      if (shouldMarkCompleted) {
        await this.animeRepository.updateStatus(animeId, 'completed');
      }
      
      // 6. Emit event for UI updates
      this.eventBus.emit('episode-watched', {
        animeId,
        episodeNumber,
        rating,
        notes,
        episodeRecord,
        animeCompleted: shouldMarkCompleted
      });
      
      return {
        success: true,
        animeId,
        episodeNumber,
        rating,
        notes,
        episodeRecord,
        animeCompleted: shouldMarkCompleted
      };
      
    } catch (error) {
      this.handleError(error, 'markEpisodeWatched');
    }
  }

  /**
   * Mark multiple episodes as watched
   * @param {Object} input - Multiple episodes marking parameters
   * @param {number} input.animeId - Anime ID
   * @param {number} input.fromEpisode - Starting episode number
   * @param {number} input.toEpisode - Ending episode number
   * @param {number} input.rating - Default rating for all episodes (optional)
   * @returns {Promise<Object>} - Mark multiple watched result
   */
  async executeMultiple(input) {
    try {
      this.validateMultipleInput(input);
      
      const { animeId, fromEpisode, toEpisode, rating } = input;
      
      // 1. Verify anime exists
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      const results = [];
      
      // 2. Mark each episode as watched
      for (let episodeNumber = fromEpisode; episodeNumber <= toEpisode; episodeNumber++) {
        try {
          const result = await this.execute({
            animeId,
            episodeNumber,
            rating,
            notes: `Batch marked - Episodes ${fromEpisode}-${toEpisode}`
          });
          results.push(result);
        } catch (error) {
          console.error(`Failed to mark episode ${episodeNumber} as watched:`, error);
          results.push({
            success: false,
            episodeNumber,
            error: error.message
          });
        }
      }
      
      // 3. Emit event for UI updates
      this.eventBus.emit('episodes-batch-watched', {
        animeId,
        fromEpisode,
        toEpisode,
        results
      });
      
      return {
        success: true,
        animeId,
        fromEpisode,
        toEpisode,
        results
      };
      
    } catch (error) {
      this.handleError(error, 'markMultipleEpisodesWatched');
    }
  }

  /**
   * Validate single episode input
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (!input.episodeNumber || typeof input.episodeNumber !== 'number') {
      throw new Error('Episode number is required and must be a number');
    }
    
    if (input.episodeNumber <= 0) {
      throw new Error('Episode number must be positive');
    }
    
    if (input.rating !== undefined) {
      if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 10) {
        throw new Error('Rating must be a number between 1 and 10');
      }
    }
    
    if (input.notes !== undefined && typeof input.notes !== 'string') {
      throw new Error('Notes must be a string if provided');
    }
  }

  /**
   * Validate multiple episodes input
   * @param {Object} input - Input to validate
   */
  validateMultipleInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (!input.fromEpisode || typeof input.fromEpisode !== 'number') {
      throw new Error('From episode is required and must be a number');
    }
    
    if (!input.toEpisode || typeof input.toEpisode !== 'number') {
      throw new Error('To episode is required and must be a number');
    }
    
    if (input.fromEpisode <= 0 || input.toEpisode <= 0) {
      throw new Error('Episode numbers must be positive');
    }
    
    if (input.fromEpisode > input.toEpisode) {
      throw new Error('From episode cannot be greater than to episode');
    }
    
    if (input.toEpisode - input.fromEpisode > 100) {
      throw new Error('Cannot mark more than 100 episodes at once');
    }
    
    if (input.rating !== undefined) {
      if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 10) {
        throw new Error('Rating must be a number between 1 and 10');
      }
    }
  }

  /**
   * Check if anime should be marked as completed
   * @param {Object} anime - Anime data
   * @param {number} episodeNumber - Latest watched episode
   * @returns {Promise<boolean>} - Whether anime should be completed
   */
  async checkIfAnimeCompleted(anime, episodeNumber) {
    // If total episodes is known and we've reached it
    if (anime.totalEpisodes && anime.totalEpisodes > 0) {
      return episodeNumber >= anime.totalEpisodes;
    }
    
    // If total episodes is unknown, don't auto-complete
    return false;
  }
}

module.exports = MarkWatched;
