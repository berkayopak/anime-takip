/**
 * EpisodeRepository - Episode entity'leri için abstract repository
 * 
 * Bu abstract class, episode-specific repository methodlarını tanımlar
 */

const BaseRepository = require('./BaseRepository');

class EpisodeRepository extends BaseRepository {
    constructor() {
        super();
    }

    // Episode-specific abstract methods

    /**
     * Anime ID'sine göre bölümleri getir
     */
    async findByAnimeId(animeId) {
        throw new Error('findByAnimeId method must be implemented by subclass');
    }

    /**
     * Belirli bir anime'nin belirli bölümünü getir
     */
    async findByAnimeAndEpisode(animeId, episodeNumber) {
        throw new Error('findByAnimeAndEpisode method must be implemented by subclass');
    }

    /**
     * İzlenmiş bölümleri getir
     */
    async findWatchedByAnimeId(animeId) {
        throw new Error('findWatchedByAnimeId method must be implemented by subclass');
    }

    /**
     * Rating'e göre bölümleri getir
     */
    async findByRating(rating) {
        throw new Error('findByRating method must be implemented by subclass');
    }

    /**
     * Tarih aralığındaki bölümleri getir
     */
    async findByDateRange(startDate, endDate) {
        throw new Error('findByDateRange method must be implemented by subclass');
    }

    /**
     * En son izlenen bölümleri getir
     */
    async findRecentlyWatched(limit = 10) {
        throw new Error('findRecentlyWatched method must be implemented by subclass');
    }

    /**
     * Bölüm record'ı ekle veya güncelle
     */
    async createOrUpdate(episode) {
        throw new Error('createOrUpdate method must be implemented by subclass');
    }

    /**
     * Bölümü izlendi olarak işaretle
     */
    async markAsWatched(animeId, episodeNumber, rating = null, notes = '') {
        throw new Error('markAsWatched method must be implemented by subclass');
    }

    /**
     * Anime'nin toplam izlenen bölüm sayısını getir
     */
    async getWatchedCount(animeId) {
        throw new Error('getWatchedCount method must be implemented by subclass');
    }

    /**
     * Rating istatistikleri
     */
    async getRatingStats(animeId = null) {
        throw new Error('getRatingStats method must be implemented by subclass');
    }

    /**
     * Anime ID validasyonu
     */
    validateAnimeId(animeId) {
        this.validateRequired(animeId, 'animeId');
        this.validateId(animeId, 'animeId');
    }

    /**
     * Episode number validasyonu
     */
    validateEpisodeNumber(episodeNumber) {
        this.validateRequired(episodeNumber, 'episodeNumber');
        
        if (!Number.isInteger(Number(episodeNumber)) || Number(episodeNumber) <= 0) {
            throw new Error(`Invalid episode number: ${episodeNumber}`);
        }
    }

    /**
     * Rating validasyonu
     */
    validateRating(rating) {
        if (rating !== null) {
            const AnimeConstants = require('../../shared/constants/AnimeConstants');
            
            if (!AnimeConstants.isValidRating(rating)) {
                throw new Error(`Invalid rating: ${rating}. Must be between ${AnimeConstants.RATING.MIN} and ${AnimeConstants.RATING.MAX}`);
            }
        }
    }
}

module.exports = EpisodeRepository;
