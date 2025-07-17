/**
 * AnimeRepository - Anime entity'leri için abstract repository
 * 
 * Bu abstract class, anime-specific repository methodlarını tanımlar
 */

const BaseRepository = require('./BaseRepository');

class AnimeRepository extends BaseRepository {
    constructor() {
        super();
    }

    // Anime-specific abstract methods

    /**
     * URL ile anime bul
     */
    async findByUrl(url) {
        throw new Error('findByUrl method must be implemented by subclass');
    }

    /**
     * Status'e göre anime'leri getir
     */
    async findByStatus(status) {
        throw new Error('findByStatus method must be implemented by subclass');
    }

    /**
     * Yeni bölümü olan anime'leri getir
     */
    async findWithNewEpisodes() {
        throw new Error('findWithNewEpisodes method must be implemented by subclass');
    }

    /**
     * Yeni bölümü olmayan anime'leri getir
     */
    async findWithoutNewEpisodes() {
        throw new Error('findWithoutNewEpisodes method must be implemented by subclass');
    }

    /**
     * Anime arama
     */
    async search(query) {
        throw new Error('search method must be implemented by subclass');
    }

    /**
     * Anime'nin bölüm sayısını güncelle
     */
    async updateEpisode(id, episodeNumber) {
        throw new Error('updateEpisode method must be implemented by subclass');
    }

    /**
     * Anime'nin status'unu güncelle
     */
    async updateStatus(id, status) {
        throw new Error('updateStatus method must be implemented by subclass');
    }

    /**
     * Son kontrol tarihini güncelle
     */
    async updateLastChecked(id) {
        throw new Error('updateLastChecked method must be implemented by subclass');
    }

    /**
     * Yeni bölüm flag'ini güncelle
     */
    async updateNewEpisodeFlag(id, hasNewEpisode) {
        throw new Error('updateNewEpisodeFlag method must be implemented by subclass');
    }

    /**
     * İstatistikleri getir
     */
    async getStats() {
        throw new Error('getStats method must be implemented by subclass');
    }

    /**
     * URL validasyonu
     */
    validateUrl(url) {
        this.validateRequired(url, 'url');
        
        if (!url.includes('turkanime.co')) {
            throw new Error('Invalid TurkAnime URL');
        }
    }

    /**
     * Status validasyonu
     */
    validateStatus(status) {
        const AnimeConstants = require('../../shared/constants/AnimeConstants');
        
        this.validateRequired(status, 'status');
        
        if (!AnimeConstants.isValidStatus(status)) {
            throw new Error(`Invalid status: ${status}`);
        }
    }
}

module.exports = AnimeRepository;
