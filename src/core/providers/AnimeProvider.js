/**
 * AnimeProvider - Anime siteleri için base provider class
 * 
 * Bu abstract class, farklı anime sitelerinden veri çekmek için
 * ortak interface sağlar. Her site için ayrı provider oluşturulabilir.
 */

const AnimeConstants = require('../../shared/constants/AnimeConstants');
const Logger = require('../../shared/utils/Logger');

class AnimeProvider {
    constructor(providerId) {
        if (this.constructor === AnimeProvider) {
            throw new Error('AnimeProvider is an abstract class and cannot be instantiated directly');
        }
        
        this.providerId = providerId;
        this.config = AnimeConstants.PROVIDERS[providerId.toUpperCase()];
        
        if (!this.config) {
            throw new Error(`Provider configuration not found: ${providerId}`);
        }
        
        this.logger = Logger;
        this.baseUrl = this.config.BASE_URL;
        this.endpoints = this.config.API_ENDPOINTS;
        this.headers = this.config.HEADERS;
        this.userAgent = this.config.USER_AGENT;
        this.selectors = this.config.SELECTORS;
        this.rateLimit = this.config.RATE_LIMITS || AnimeConstants.RATE_LIMIT;
    }

    /**
     * Provider bilgilerini al
     */
    getProviderInfo() {
        return {
            id: this.providerId,
            name: this.config.NAME,
            baseUrl: this.baseUrl,
            supportedEndpoints: Object.keys(this.endpoints)
        };
    }

    /**
     * API URL'ini oluştur
     */
    buildApiUrl(endpoint) {
        const endpointPath = this.endpoints[endpoint.toUpperCase()];
        if (!endpointPath) {
            throw new Error(`Endpoint not supported by ${this.providerId}: ${endpoint}`);
        }
        return `${this.baseUrl}${endpointPath}`;
    }

    /**
     * HTTP başlıklarını hazırla
     */
    buildHeaders(additionalHeaders = {}) {
        return {
            'User-Agent': this.userAgent,
            ...this.headers,
            ...additionalHeaders
        };
    }

    /**
     * Rate limiting kontrolü
     */
    async enforceRateLimit() {
        if (this.rateLimit.REQUEST_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimit.REQUEST_DELAY));
        }
    }

    // Abstract methods - Alt sınıflar tarafından implement edilmelidir

    /**
     * Anime kategorilerini çek
     */
    async getCategories() {
        throw new Error('getCategories method must be implemented by subclass');
    }

    /**
     * Anime listesini çek
     */
    async getAnimeList(options = {}) {
        throw new Error('getAnimeList method must be implemented by subclass');
    }

    /**
     * Anime ara
     */
    async searchAnime(query, options = {}) {
        throw new Error('searchAnime method must be implemented by subclass');
    }

    /**
     * Anime detaylarını çek
     */
    async getAnimeDetails(animeId) {
        throw new Error('getAnimeDetails method must be implemented by subclass');
    }

    /**
     * Bölüm listesini çek
     */
    async getEpisodeList(animeId) {
        throw new Error('getEpisodeList method must be implemented by subclass');
    }

    /**
     * Browser instance'ını hazırla (Puppeteer kullanacak provider'lar için)
     */
    async initializeBrowser() {
        // Override by subclass if needed
    }

    /**
     * Browser'ı temizle
     */
    async closeBrowser() {
        // Override by subclass if needed
    }

    /**
     * Token al (API token gerektiren siteler için)
     */
    async getApiToken() {
        // Override by subclass if needed
        return null;
    }

    /**
     * Hata yönetimi
     */
    handleError(error, context = '') {
        this.logger.error(`[${this.providerId}] ${context}:`, error);
        throw error;
    }

    /**
     * Başarı logu
     */
    logSuccess(message, data = null) {
        this.logger.info(`[${this.providerId}] ${message}`, data);
    }

    /**
     * Provider'ın sağlık durumunu kontrol et
     */
    async healthCheck() {
        try {
            await this.getCategories();
            return { status: 'healthy', provider: this.providerId };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                provider: this.providerId, 
                error: error.message 
            };
        }
    }
}

module.exports = AnimeProvider;
