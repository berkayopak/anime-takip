
const TurkAnimeAdapter = require('./TurkAnimeAdapter');

/**
 * Scraping Service
 * Handles all web scraping operations via provider adapters (e.g. TurkAnimeAdapter)
 */
class ScrapingService {
  constructor(adapter = null) {
    // Dependency injection: provider adapter (default TurkAnimeAdapter)
    this.adapter = adapter || new TurkAnimeAdapter();
    this.isInitialized = false;
  }

  /**
   * Initialize the scraping service
   */
  async initialize() {
    try {
      if (this.adapter.initializeBrowser) {
        await this.adapter.initializeBrowser();
      }
      this.isInitialized = true;
      console.log('✅ Scraping Service initialized (adapter-based)');
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Scraping Service:', error);
      throw error;
    }
  }

  /**
   * Get anime details from anime page
   * @param {string} url - Anime URL
   * @returns {Promise<Object>} - Anime details
   */
  async getAnimeDetails(url) {
    // Adapter üzerinden çağırılacak şekilde refactor edilmeli
    if (this.adapter.getAnimeDetails) {
      return await this.adapter.getAnimeDetails(url);
    }
    throw new Error('getAnimeDetails not implemented in adapter');
  }

  /**
   * Get episode list from anime page
   * @param {string} url - Anime URL
   * @returns {Promise<Object>} - Episode data
   */
  async getEpisodeList(url) {
    if (this.adapter.getEpisodeList) {
      return await this.adapter.getEpisodeList(url);
    }
    throw new Error('getEpisodeList not implemented in adapter');
  }

  /**
   * Search anime on TurkAnime.co
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Search results
   */
  async searchAnime(query, token = null, categories = []) {
    if (this.adapter.searchAnime) {
      return await this.adapter.searchAnime(query, token, categories);
    }
    throw new Error('searchAnime not implemented in adapter');
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.adapter.closeBrowser) {
        await this.adapter.closeBrowser();
      }
      this.isInitialized = false;
      console.log('🌐 Scraping Service cleaned up (adapter-based)');
    } catch (error) {
      console.error('Error cleaning up Scraping Service:', error);
    }
  }
}

module.exports = ScrapingService;
