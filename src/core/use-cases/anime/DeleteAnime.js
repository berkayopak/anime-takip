const BaseUseCase = require('../BaseUseCase');

/**
 * Delete Anime Use Case
 * Handles the business logic for removing anime from tracking list
 */
class DeleteAnime extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.animeRepository = dependencies.animeRepository;
    this.episodeRepository = dependencies.episodeRepository;
    this.eventBus = dependencies.eventBus;
  }

  /**
   * Execute delete anime use case
   * @param {Object} input - Delete parameters
   * @param {number} input.animeId - Anime ID to delete
   * @param {boolean} input.deleteEpisodeRecords - Whether to delete related episode records
   * @returns {Promise<Object>} - Delete result
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      const { animeId, deleteEpisodeRecords = true } = input;
      
      // 1. Get anime data before deletion (for event)
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // 2. Delete related episode records if requested
      if (deleteEpisodeRecords && this.episodeRepository) {
        await this.deleteRelatedEpisodeRecords(animeId);
      }
      
      // 3. Delete anime from repository
      await this.animeRepository.delete(animeId);
      
      // 4. Emit event for UI updates
      this.eventBus.emit('anime-deleted', {
        animeId,
        anime: anime,
        deletedEpisodeRecords: deleteEpisodeRecords
      });
      
      return { 
        success: true, 
        animeId, 
        deletedAnime: anime,
        deletedEpisodeRecords: deleteEpisodeRecords 
      };
      
    } catch (error) {
      this.handleError(error, 'deleteAnime');
    }
  }

  /**
   * Delete anime with confirmation
   * @param {Object} input - Delete parameters with confirmation
   * @param {number} input.animeId - Anime ID to delete
   * @param {string} input.confirmationTitle - Title for confirmation (must match anime title)
   * @param {boolean} input.deleteEpisodeRecords - Whether to delete related episode records
   * @returns {Promise<Object>} - Delete result
   */
  async executeWithConfirmation(input) {
    try {
      this.validateConfirmationInput(input);
      
      const { animeId, confirmationTitle, deleteEpisodeRecords = true } = input;
      
      // 1. Get anime data for confirmation
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // 2. Verify confirmation title matches
      if (anime.title.toLowerCase() !== confirmationTitle.toLowerCase()) {
        throw new Error('Confirmation title does not match anime title');
      }
      
      // 3. Proceed with deletion
      return await this.execute({ animeId, deleteEpisodeRecords });
      
    } catch (error) {
      this.handleError(error, 'deleteAnimeWithConfirmation');
    }
  }

  /**
   * Validate delete input
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.animeId || typeof input.animeId !== 'number') {
      throw new Error('Anime ID is required and must be a number');
    }
    
    if (input.animeId <= 0) {
      throw new Error('Anime ID must be a positive number');
    }
    
    if (input.deleteEpisodeRecords !== undefined && typeof input.deleteEpisodeRecords !== 'boolean') {
      throw new Error('deleteEpisodeRecords must be a boolean if provided');
    }
  }

  /**
   * Validate confirmation input
   * @param {Object} input - Input to validate
   */
  validateConfirmationInput(input) {
    this.validateInput(input);
    
    if (!input.confirmationTitle || typeof input.confirmationTitle !== 'string') {
      throw new Error('Confirmation title is required and must be a string');
    }
    
    if (input.confirmationTitle.trim().length === 0) {
      throw new Error('Confirmation title cannot be empty');
    }
  }

  /**
   * Delete related episode records
   * @param {number} animeId - Anime ID
   */
  async deleteRelatedEpisodeRecords(animeId) {
    try {
      if (this.episodeRepository && typeof this.episodeRepository.deleteByAnimeId === 'function') {
        await this.episodeRepository.deleteByAnimeId(animeId);
      }
    } catch (error) {
      console.error('Failed to delete related episode records:', error);
      // Don't throw error here, we still want to delete the anime
    }
  }

  /**
   * Soft delete anime (mark as deleted instead of removing)
   * @param {Object} input - Soft delete parameters
   * @param {number} input.animeId - Anime ID to soft delete
   * @returns {Promise<Object>} - Soft delete result
   */
  async softDelete(input) {
    try {
      this.validateInput(input);
      
      const { animeId } = input;
      
      // 1. Get anime data before soft deletion
      const anime = await this.animeRepository.findById(animeId);
      if (!anime) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      
      // 2. Update anime status to 'deleted'
      await this.animeRepository.update(animeId, { 
        status: 'deleted',
        deletedAt: new Date().toISOString()
      });
      
      // 3. Emit event for UI updates
      this.eventBus.emit('anime-soft-deleted', {
        animeId,
        anime: anime
      });
      
      return { 
        success: true, 
        animeId, 
        softDeleted: true,
        anime: anime 
      };
      
    } catch (error) {
      this.handleError(error, 'softDeleteAnime');
    }
  }
}

module.exports = DeleteAnime;
