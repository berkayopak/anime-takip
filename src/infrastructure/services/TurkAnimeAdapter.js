// TurkAnimeAdapter.js
// Site-specific scraping adapter for turkanime.co
// Clean Architecture: Infrastructure Service

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const AnimeConstants = require('../../shared/constants/AnimeConstants');

class TurkAnimeAdapter {
  constructor(options = {}) {
    this.browser = null;
    this.options = options;
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async getAnimeDetails(url) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const details = await page.evaluate(() => {
        let imageUrl = null;
        const imajImg = document.querySelector('.imaj img');
        if (imajImg && imajImg.src) {
          imageUrl = imajImg.src;
        } else {
          const posterImg = document.querySelector('.poster img, .cover img, .anime-poster img');
          if (posterImg && posterImg.src) {
            imageUrl = posterImg.src;
          }
        }
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
      await page.close();
      throw error;
    }
  }

  async getEpisodeList(url) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const episodeData = await page.evaluate(() => {
        const episodes = [];
        const episodeElements = document.querySelectorAll('.bolumler .item, .episode-list .episode, .bolum-liste .bolum');
        episodeElements.forEach((element, index) => {
          let episodeNumber = index + 1;
          let episodeTitle = '';
          let episodeUrl = '';
          const numberElement = element.querySelector('.episode-number, .bolum-no, [data-episode]');
          if (numberElement) {
            const numberText = numberElement.textContent || numberElement.getAttribute('data-episode');
            const match = numberText.match(/(\d+)/);
            if (match) {
              episodeNumber = parseInt(match[1]);
            }
          }
          const titleElement = element.querySelector('.episode-title, .bolum-baslik, .title');
          if (titleElement) {
            episodeTitle = titleElement.textContent.trim();
          }
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
      await page.close();
      throw error;
    }
  }

  async searchAnime(query, token, categories = []) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    const provider = AnimeConstants.PROVIDERS.TURKANIME;
    try {
      const headers = {
        ...provider.HEADERS,
        'User-Agent': provider.USER_AGENT,
        'Referer': provider.BASE_URL + '/',
        'token': token
      };
      await page.setExtraHTTPHeaders(headers);
      await page.goto(provider.BASE_URL + '/', { waitUntil: 'networkidle2' });
      const apiUrl = provider.BASE_URL + provider.API_ENDPOINTS.ANIME_LIST;
      const response = await page.evaluate(async (apiUrl, apiToken, headers) => {
        try {
          const fetchHeaders = { ...headers, 'token': apiToken };
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: fetchHeaders
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.text();
        } catch (error) {
          return null;
        }
      }, apiUrl, token, headers);
      await page.close();
      if (!response) return null;
      return this.parseAnimeList(response, query, categories);
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  parseAnimeList(htmlContent, query, categories = []) {
    const results = [];
    const queryLower = query.toLowerCase();
    const $ = cheerio.load(htmlContent);
    $('a').each((index, element) => {
      const title = $(element).text().trim();
      const href = $(element).attr('href');
      if (title.toLowerCase().includes(queryLower)) {
        results.push({ title, url: href });
      }
    });
    return results;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = TurkAnimeAdapter;
// TurkAnimeAdapter.js
// Site-specific scraping adapter for turkanime.co
// Clean Architecture: Infrastructure Service

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const AnimeConstants = require('../../shared/constants/AnimeConstants');

class TurkAnimeAdapter {
  constructor(options = {}) {
    this.browser = null;
    this.options = options;
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async getAnimeDetails(url) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    try {
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
      await page.close();
      throw error;
    }
  }

  async getEpisodeList(url) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    try {
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
      await page.close();
      throw error;
    }
  }

  async searchAnime(query, token, categories = []) {
    await this.initializeBrowser();
    const page = await this.browser.newPage();
    const provider = AnimeConstants.PROVIDERS.TURKANIME;
    try {
      // Merge token into headers
      const headers = {
        ...provider.HEADERS,
        'User-Agent': provider.USER_AGENT,
        'Referer': provider.BASE_URL + '/',
        'token': token
      };
      await page.setExtraHTTPHeaders(headers);
      await page.goto(provider.BASE_URL + '/', { waitUntil: 'networkidle2' });
      const apiUrl = provider.BASE_URL + provider.API_ENDPOINTS.ANIME_LIST;
      const response = await page.evaluate(async (apiUrl, apiToken, headers) => {
        try {
          const fetchHeaders = { ...headers, 'token': apiToken };
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: fetchHeaders
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.text();
        } catch (error) {
          return null;
        }
      }, apiUrl, token, headers);
      await page.close();
      if (!response) return null;
      return this.parseAnimeList(response, query, categories);
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  parseAnimeList(htmlContent, query, categories = []) {
    const results = [];
    const queryLower = query.toLowerCase();
    const $ = cheerio.load(htmlContent);
    $('a').each((index, element) => {
      const title = $(element).text().trim();
      const href = $(element).attr('href');
      if (title.toLowerCase().includes(queryLower)) {
        results.push({ title, url: href });
      }
    });
    return results;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = TurkAnimeAdapter;
