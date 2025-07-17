const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scraping Service
 * Handles all web scraping operations for TurkAnime.co
 */
class ScrapingService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the scraping service
   */
  async initialize() {
    try {
      await this.initializeBrowser();
      this.isInitialized = true;
      console.log('✅ Scraping Service initialized');
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Scraping Service:', error);
      throw error;
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('🌐 Browser initialized for scraping');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Get anime details from anime page
   * @param {string} url - Anime URL
   * @returns {Promise<Object>} - Anime details
   */
  async getAnimeDetails(url) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const details = await page.evaluate(() => {
        // Extract image URL from anime page - prioritize .imaj img
        let imageUrl = null;
        
        // Try to find image in .imaj container first
        const imajImg = document.querySelector('.imaj img');
        if (imajImg && imajImg.src) {
          imageUrl = imajImg.src;
        } else {
          // Fallback to other possible selectors
          const posterImg = document.querySelector('.poster img, .cover img, .anime-poster img');
          if (posterImg && posterImg.src) {
            imageUrl = posterImg.src;
          }
        }
        
        // Extract total episodes if available
        let totalEpisodes = 0;
        const episodeElements = document.querySelectorAll('.bolumler .item, .episode-list .episode');
        if (episodeElements.length > 0) {
          totalEpisodes = episodeElements.length;
        }
        
        return {
          image: imageUrl,
          totalEpisodes: totalEpisodes
        };
      });
      
      await page.close();
      return details;
      
    } catch (error) {
      console.error('Error getting anime details:', error);
      throw error;
    }
  }

  /**
   * Get episode list from anime page
   * @param {string} url - Anime URL
   * @returns {Promise<Object>} - Episode data
   */
  async getEpisodeList(url) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const episodeData = await page.evaluate(() => {
        const episodes = [];
        
        // Try different selectors for episodes
        const episodeElements = document.querySelectorAll('.bolumler .item, .episode-list .episode, .bolum-liste .bolum');
        
        episodeElements.forEach((element, index) => {
          let episodeNumber = index + 1;
          let episodeTitle = '';
          let episodeUrl = '';
          
          // Try to extract episode number
          const numberElement = element.querySelector('.episode-number, .bolum-no, [data-episode]');
          if (numberElement) {
            const numberText = numberElement.textContent || numberElement.getAttribute('data-episode');
            const match = numberText.match(/(\d+)/);
            if (match) {
              episodeNumber = parseInt(match[1]);
            }
          }
          
          // Try to extract episode title
          const titleElement = element.querySelector('.episode-title, .bolum-baslik, .title');
          if (titleElement) {
            episodeTitle = titleElement.textContent.trim();
          }
          
          // Try to extract episode URL
          const linkElement = element.querySelector('a');
          if (linkElement && linkElement.href) {
            episodeUrl = linkElement.href;
          }
          
          episodes.push({
            episode: episodeNumber,
            title: episodeTitle || `Episode ${episodeNumber}`,
            url: episodeUrl
          });
        });
        
        return {
          episodes: episodes,
          totalEpisodes: episodes.length
        };
      });
      
      await page.close();
      return episodeData;
      
    } catch (error) {
      console.error('Error getting episode list:', error);
      throw error;
    }
  }

  /**
   * Search anime on TurkAnime.co
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Search results
   */
  async searchAnime(query) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to search page
      const searchUrl = `https://www.turkanime.co/arama?search=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const results = await page.evaluate(() => {
        const animeList = [];
        const animeElements = document.querySelectorAll('.anime-item, .search-result, .content-item');
        
        animeElements.forEach(element => {
          const titleElement = element.querySelector('.anime-title, .title, h3, h4');
          const linkElement = element.querySelector('a');
          const imageElement = element.querySelector('img');
          
          if (titleElement && linkElement) {
            animeList.push({
              title: titleElement.textContent.trim(),
              url: linkElement.href,
              image: imageElement ? imageElement.src : null
            });
          }
        });
        
        return animeList;
      });
      
      await page.close();
      return results;
      
    } catch (error) {
      console.error('Error searching anime:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isInitialized = false;
      console.log('🌐 Scraping Service cleaned up');
    } catch (error) {
      console.error('Error cleaning up Scraping Service:', error);
    }
  }
}

module.exports = ScrapingService;
