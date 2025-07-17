const BaseUseCase = require('../BaseUseCase');

/**
 * Search Anime Use Case
 * Handles the business logic for searching anime on external sources
 */
class SearchAnime extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.scrapingService = dependencies.scrapingService;
    this.userSettingsRepository = dependencies.userSettingsRepository;
    this.cacheService = dependencies.cacheService; // Optional caching
  }

  /**
   * Execute search anime use case
   * @param {Object} input - Search parameters
   * @param {string} input.query - Search query
   * @param {Array} input.categories - Categories to filter (optional)
   * @returns {Promise<Array>} - Search results
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      const { query, categories = [] } = input;
      
      // 1. Check cache first if available
      const cacheKey = `search_${query}_${categories.join('_')}`;
      if (this.cacheService) {
        const cachedResults = await this.cacheService.get(cacheKey);
        if (cachedResults) {
          return cachedResults;
        }
      }
      
      // 2. Get categories from database if not provided
      const searchCategories = categories.length > 0 ? 
        categories : 
        await this.getCategoriesFromDB();
      
      // 3. Perform search using scraping service
      const results = await this.scrapingService.searchAnime(query, searchCategories);
      
      // 4. Cache results if service available
      if (this.cacheService && results.length > 0) {
        await this.cacheService.set(cacheKey, results, 300); // 5 minute cache
      }
      
      // 5. Return processed results
      return this.processSearchResults(results, query);
      
    } catch (error) {
      this.handleError(error, 'searchAnime');
    }
  }

  /**
   * Validate search input
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.query || typeof input.query !== 'string') {
      throw new Error('Search query is required and must be a string');
    }
    
    if (input.query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }
    
    if (input.categories && !Array.isArray(input.categories)) {
      throw new Error('Categories must be an array if provided');
    }
  }

  /**
   * Get categories from database
   * @returns {Promise<Array>} - Categories list
   */
  async getCategoriesFromDB() {
    try {
      const categories = await this.userSettingsRepository.getCategories();
      
      // If no categories in database, return default ones
      if (categories.length === 0) {
        const defaultCategories = [
          'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
          'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
          'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
          'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
          'Aile', 'Çocuk'
        ];
        
        await this.userSettingsRepository.saveCategories(defaultCategories);
        return defaultCategories;
      }
      
      return categories;
    } catch (error) {
      console.error('Failed to get categories from database:', error);
      // Return fallback categories
      return [
        'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
        'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei'
      ];
    }
  }

  /**
   * Process and clean search results
   * @param {Array} results - Raw search results
   * @param {string} query - Original search query
   * @returns {Array} - Processed results
   */
  processSearchResults(results, query) {
    // Sort by relevance (title match accuracy)
    const queryLower = query.toLowerCase();
    
    return results
      .map(anime => ({
        ...anime,
        relevance: this.calculateRelevance(anime.title, queryLower)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .map(({ relevance, ...anime }) => anime); // Remove relevance field from final result
  }

  /**
   * Calculate search relevance score
   * @param {string} title - Anime title
   * @param {string} query - Search query (lowercase)
   * @returns {number} - Relevance score
   */
  calculateRelevance(title, query) {
    const titleLower = title.toLowerCase();
    
    // Exact match gets highest score
    if (titleLower === query) return 100;
    
    // Starts with query gets high score
    if (titleLower.startsWith(query)) return 90;
    
    // Contains query gets medium score
    if (titleLower.includes(query)) return 70;
    
    // Word-based matching
    const titleWords = titleLower.split(/\s+/);
    const queryWords = query.split(/\s+/);
    
    let wordMatches = 0;
    for (const queryWord of queryWords) {
      for (const titleWord of titleWords) {
        if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
          wordMatches++;
          break;
        }
      }
    }
    
    return (wordMatches / queryWords.length) * 50;
  }
}

module.exports = SearchAnime;
