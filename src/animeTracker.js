const UseCaseManager = require('./infrastructure/UseCaseManager');
const notifier = require('node-notifier');
const path = require('path');

class AnimeTracker {
  constructor(mainWindow = null) {
    this.useCaseManager = new UseCaseManager(mainWindow);
    this.updateInterval = null;
    this.isChecking = false;
    this.isInitialized = false; // Track initialization status
    this.mainWindow = mainWindow; // Store reference to main window for IPC
    this.settings = {
      checkInterval: 30,
      notifications: true,
      autoRefresh: true
    };
  }

  async initialize() {
    try {
      await this.useCaseManager.initialize();
      await this.loadSettings();
      
      this.isInitialized = true; // Mark as initialized only after successful completion
      console.log('✅ Anime tracker initialized successfully with Use Case Manager');
    } catch (error) {
      this.isInitialized = false; // Explicitly set to false on error
      console.error('Failed to initialize anime tracker:', error);
      
      // Don't throw error, allow app to continue with basic functionality
      // The IPC handlers will handle re-initialization when needed
    }
  }

  async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      // Browser initialized
    } catch (error) {
      console.error('Failed to initialize browser:', error);
    }
  }

  async loadSettings() {
    try {
      // Use UserSettingsRepository through Use Case Manager
      const userSettingsRepo = this.useCaseManager.databaseManager.getUserSettingsRepository();
      const checkInterval = await userSettingsRepo.getSetting('checkInterval');
      const notifications = await userSettingsRepo.getSetting('notifications');
      const autoRefresh = await userSettingsRepo.getSetting('autoRefresh');
      
      this.settings = {
        checkInterval: parseInt(checkInterval) || 30,
        notifications: notifications === 'true',
        autoRefresh: autoRefresh === 'true'
      };
      
      console.log('✅ Settings loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      // Use defaults if loading fails
    }
  }

  async saveSettings(settings) {
    try {
      const userSettingsRepo = this.dbManager.getUserSettingsRepository();
      await userSettingsRepo.setSetting('checkInterval', settings.checkInterval.toString());
      await userSettingsRepo.setSetting('notifications', settings.notifications.toString());
      await userSettingsRepo.setSetting('autoRefresh', settings.autoRefresh.toString());
      
      // Update local settings
      this.settings = { ...settings };
      
      // Restart auto refresh with new interval if enabled
      // AUTO-REFRESH IS NOW HANDLED BY FRONTEND FOR BETTER CONTROL
      // this.stopAutoRefresh();
      // if (this.settings.autoRefresh) {
      //   this.startAutoRefresh();
      // }
      
      // Settings saved
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async getSettings() {
    // Backend getSettings called
    return { ...this.settings };
  }

  async searchAnime(query) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      // Get categories from database first
      const categories = await this.getCategoriesFromDB();
      
      // Get current API token
      const token = await this.getApiToken();
      
      const page = await this.browser.newPage();
      
      // Set headers to match the curl request
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Accept': '*/*',
        'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://www.turkanime.co/',
        'token': token,
        'X-Requested-With': 'XMLHttpRequest',
        'Alt-Used': 'www.turkanime.co',
        'Connection': 'keep-alive'
      });

      // First visit the main page to get cookies
      await page.goto('https://www.turkanime.co/', { waitUntil: 'networkidle2' });

      // Make API request to get full anime list
      const response = await page.evaluate(async (apiToken) => {
        try {
          const response = await fetch('https://www.turkanime.co/ajax/tamliste', {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
              'Accept': '*/*',
              'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
              'Referer': 'https://www.turkanime.co/',
              'token': apiToken,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.text();
        } catch (error) {
          return null;
        }
      }, token);

      await page.close();

      if (!response) {
        // API request failed, falling back to HTML parsing
        return await this.searchAnimeHTML(query, categories);
      }

      // Parse the response and filter by query
      const animes = this.parseAnimeList(response, query, categories);
      // Found anime results
      return animes;

    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to HTML parsing if API fails
      return await this.searchAnimeHTML(query, []);
    }
  }

  parseAnimeList(htmlContent, query, categories = []) {
    try {
      const results = [];
      const queryLower = query.toLowerCase();
      
      // Parse HTML content - TurkAnime returns HTML list
      const $ = cheerio.load(htmlContent);
      
      $('a').each((index, element) => {
        const $el = $(element);
        let title = $el.text().trim();
        const href = $el.attr('href');
        
        if (title && href && title.toLowerCase().includes(queryLower)) {
          let cleanTitle = title;
          
          // If we have categories from API, use them for more accurate cleaning
          if (categories && categories.length > 0) {
            // Create a regex pattern to match categories at the end of the title
            const escapedCategories = categories.map(cat => cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const categoryPattern = new RegExp(`(${escapedCategories.join('|')})(?:\\s*,\\s*(${escapedCategories.join('|')}))*\\s*$`, 'i');
            cleanTitle = title.replace(categoryPattern, '').trim();
            
            // Also handle cases where categories are listed without commas
            categories.forEach(category => {
              if (cleanTitle.endsWith(category)) {
                cleanTitle = cleanTitle.substring(0, cleanTitle.length - category.length).trim();
              }
            });
            
            // Dynamic category cleaning done
          } else {
            // Fallback to hardcoded category cleaning
            const categoryPattern = /(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem|Bilim Kurgu|Supernatural|Seinen|Shounen|Shoujo|Josei|Ecchi|Harem|Slice of Life|Okul|Spor|Müzik|Tarih|Askeri|Polis|Gerilim|Korku|Yaoi|Yuri|Mecha|Uzay|Aile|Çocuk)/g;
            
            // Try to find where categories start
            const delimiterPatterns = [
              /^(.*?)(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem|Bilim Kurgu)/,
              /^(.*?)\s+(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem)/,
              /^(.*?)\s*([A-Z][a-zığşçöüİĞŞÇÖÜ]+,\s*[A-Z][a-zığşçöüİĞŞÇÖÜ]+)/
            ];
            
            for (let pattern of delimiterPatterns) {
              const match = title.match(pattern);
              if (match && match[1]) {
                cleanTitle = match[1].trim();
                // Cleaned title
                break;
              }
            }
            
            // Method 2: If we didn't find a clear split, try to remove known categories from the end
            if (cleanTitle === title) {
              // Split by common separators and check if last parts are categories
              const parts = title.split(/[,\s]+/);
              const titleParts = [];
              
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                // If this part looks like a category, stop here
                if (categoryPattern.test(part)) {
                  break;
                }
                titleParts.push(part);
              }
              
              if (titleParts.length > 0 && titleParts.length < parts.length) {
                cleanTitle = titleParts.join(' ').trim();
                // Category-based cleaning done
              }
            }
            
            // Fallback: Remove trailing non-alphanumeric clusters that look like categories
            if (cleanTitle === title) {
              const fallbackMatch = title.match(/^(.*?)\s*[A-Z][a-zığşçöüİĞŞÇÖÜ]+(?:,\s*[A-Z][a-zığşçöüİĞŞÇÖÜ]+)*$/);
              if (fallbackMatch && fallbackMatch[1] && fallbackMatch[1].length > 5) {
                cleanTitle = fallbackMatch[1].trim();
                // Fallback cleaning done
              }
            }
          }
          
          results.push({
            title: cleanTitle,
            url: href.startsWith('http') ? href : `https://${href}`,
            image: null, // Will be fetched after adding anime
            id: href.split('/').pop()
          });
        }
      });

      // Limit results to top 20 matches
      return results.slice(0, 20);
    } catch (error) {
      console.error('Failed to parse anime list:', error);
      return [];
    }
  }

  // Fallback method using HTML parsing
  async searchAnimeHTML(query, categories = []) {
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to TurkAnime main page and search
      await page.goto('https://www.turkanime.co/', { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract anime links from main page or search
      const animes = await page.evaluate((searchQuery, categoryList) => {
        const results = [];
        const queryLower = searchQuery.toLowerCase();
        
        // Look for anime links
        const links = document.querySelectorAll('a[href*="/anime/"], a[href*="/tanitim/"]');
        
        links.forEach(link => {
          let title = link.textContent.trim();
          const href = link.href;
          
          if (title && href && title.toLowerCase().includes(queryLower)) {
            let cleanTitle = title;
            
            // If we have categories from API, use them for more accurate cleaning
            if (categoryList && categoryList.length > 0) {
              // Create a regex pattern to match categories at the end of the title
              const escapedCategories = categoryList.map(cat => cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
              const categoryPattern = new RegExp(`(${escapedCategories.join('|')})(?:\\s*,\\s*(${escapedCategories.join('|')}))*\\s*$`, 'i');
              cleanTitle = title.replace(categoryPattern, '').trim();
              
              // Also handle cases where categories are listed without commas
              categoryList.forEach(category => {
                if (cleanTitle.endsWith(category)) {
                  cleanTitle = cleanTitle.substring(0, cleanTitle.length - category.length).trim();
                }
              });
            } else {
              // Fallback to hardcoded category cleaning
              const categoryPattern = /(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem|Bilim Kurgu|Supernatural|Seinen|Shounen|Shoujo|Josei|Ecchi|Harem|Slice of Life|Okul|Spor|Müzik|Tarih|Askeri|Polis|Gerilim|Korku|Yaoi|Yuri|Mecha|Uzay|Aile|Çocuk)/g;
              
              // Method 1: Look for pattern where categories start
              const delimiterPatterns = [
                /^(.*?)(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem|Bilim Kurgu)/,
                /^(.*?)\s+(Aksiyon|Dram|Komedi|Romantik|Fantastik|Macera|Gizem)/,
                /^(.*?)\s*([A-Z][a-zığşçöüİĞŞÇÖÜ]+,\s*[A-Z][a-zığşçöüİĞŞÇÖÜ]+)/
              ];
              
              for (let pattern of delimiterPatterns) {
                const match = title.match(pattern);
                if (match && match[1]) {
                  cleanTitle = match[1].trim();
                  break;
                }
              }
              
              // Method 2: Remove known categories from the end
              if (cleanTitle === title) {
                const parts = title.split(/[,\s]+/);
                const titleParts = [];
                
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i].trim();
                  if (categoryPattern.test(part)) {
                    break;
                  }
                  titleParts.push(part);
                }
                
                if (titleParts.length > 0 && titleParts.length < parts.length) {
                  cleanTitle = titleParts.join(' ').trim();
                }
              }
            }
            
            results.push({
              title: cleanTitle,
              url: href,
              image: null,
              id: href.split('/').pop()
            });
          }
        });
        
        return results.slice(0, 20);
      }, query, categories);

      await page.close();
      return animes;
    } catch (error) {
      console.error('HTML search failed:', error);
      return [];
    }
  }

  async addAnime(animeData) {
    try {
      // Use AddAnime use case
      const addAnimeUseCase = this.useCaseManager.getUseCase('addAnime');
      
      const result = await addAnimeUseCase.execute({
        title: animeData.title,
        url: animeData.url,
        currentEpisode: animeData.currentEpisode || 0
      });
      
      console.log('✅ Anime added successfully using AddAnime use case');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to add anime:', error);
      throw error;
    }
  }

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
        
        // First try to find image in .imaj div (correct anime poster)
        const imajImg = document.querySelector('.imaj img');
        if (imajImg) {
          imageUrl = imajImg.src || imajImg.getAttribute('data-src');
        } else {
          // Fallback to other selectors
          const imgElement = document.querySelector('.thumbnail img, img.media-object, .poster img');
          if (imgElement) {
            imageUrl = imgElement.src || imgElement.getAttribute('data-src');
          }
        }
        
        // Convert relative URL to absolute
        if (imageUrl && imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = 'https://www.turkanime.co' + imageUrl;
        }

        // Try to find episode count from info table
        let totalEpisodes = 0;
        let isUnknownTotal = false; // Flag to track if we found "?" format
        
        // Method 1: Look for "Bölüm Sayısı" in all table structures
        const allTableElements = document.querySelectorAll('table, .anime-info, .info-list, .details');
        
        for (let table of allTableElements) {
          const rows = table.querySelectorAll('tr, .info-row, .detail-row');
          
          for (let row of rows) {
            const rowText = row.textContent.toLowerCase();
            
            if (rowText.includes('bölüm sayısı') || rowText.includes('episode')) {
              // Try different cell structures
              const cells = row.querySelectorAll('td, .info-label, .info-value, .detail-label, .detail-value, span, div');
              
              for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                const cellText = cell.textContent.trim();
                
                // Skip cells that contain "bölüm sayısı" (these are labels, not values)
                if (cellText.toLowerCase().includes('bölüm sayısı') || cellText === ':') {
                  continue;
                }
                
                // Look for patterns like "24", "24/24", "24 / 24", "24 / ?", "Episode 24"
                const patterns = [
                  /(\d+)\s*\/\s*(\d+)/,      // "24/24" format - use second number
                  /(\d+)\s*\/\s*\?/,         // "24/?" format - unknown total
                  /(\d+)\s*bölüm/i,          // "24 bölüm" format
                  /episode\s*(\d+)/i,        // "Episode 24" format
                  /^(\d+)$/                  // Just a number
                ];
                
                for (let pattern of patterns) {
                  const match = cellText.match(pattern);
                  if (match) {
                    const num1 = parseInt(match[1]);
                    const num2 = match[2] ? parseInt(match[2]) : null;
                    
                    // Handle "X / ?" format - check if the second part is ?
                    if (pattern.source.includes('\\?')) {
                      totalEpisodes = 0; // Unknown total episodes
                      isUnknownTotal = true; // Set flag to prevent fallback
                      break;
                    }
                    
                    // If there are two numbers (like 24/24), use the second one (total)
                    // If it's just one number, use that
                    totalEpisodes = num2 || num1;
                    
                    // Validate the number makes sense
                    if (totalEpisodes > 0 && totalEpisodes <= 5000) {
                      break;
                    } else {
                      totalEpisodes = 0; // Reset if invalid
                    }
                  }
                }
                
                if (totalEpisodes > 0 || isUnknownTotal) break;
              }
              
              if (totalEpisodes > 0 || isUnknownTotal) break;
            }
          }
          
          if (totalEpisodes > 0 || isUnknownTotal) break;
        }
        
        // Method 2: Search in all text content for episode info (only if not unknown total)
        if (totalEpisodes === 0 && !isUnknownTotal) {
          const allText = document.body.textContent.toLowerCase();
          const lines = allText.split('\n');
          
          for (let line of lines) {
            if (line.includes('bölüm sayısı') || line.includes('episode')) {
              const patterns = [
                /(\d+)\s*\/\s*(\d+)/,  // "24/24" format
                /(\d+)\s*\/\s*\?/,     // "24/?" format - unknown total
                /(\d+)\s*bölüm/i,      // "24 bölüm" format
                /episode\s*(\d+)/i     // "Episode 24" format
              ];
              
              for (let pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                  // Handle "X / ?" format specifically
                  if (line.includes('/') && line.includes('?')) {
                    totalEpisodes = 0; // Unknown total episodes
                    isUnknownTotal = true; // Set flag to prevent further fallback
                    break;
                  }
                  
                  const num1 = parseInt(match[1]);
                  const num2 = match[2] ? parseInt(match[2]) : null;
                  totalEpisodes = num2 || num1;
                  
                  if (totalEpisodes > 0 && totalEpisodes <= 5000) {
                    break;
                  } else {
                    totalEpisodes = 0;
                  }
                }
              }
              
              if (totalEpisodes > 0 || isUnknownTotal) break;
            }
          }
        }
        
        // Fallback: look for episode list (only if not unknown total)
        if (totalEpisodes === 0 && !isUnknownTotal) {
          const episodeElements = document.querySelectorAll('.episode-list .episode, .bolum-listesi .bolum');
          totalEpisodes = episodeElements.length;
        }
        
        // Last fallback: look for episode count in text (only if not unknown total)
        if (totalEpisodes === 0 && !isUnknownTotal) {
          const text = document.body.textContent;
          const episodeMatch = text.match(/(\d+)\s*bölüm/i);
          if (episodeMatch) {
            totalEpisodes = parseInt(episodeMatch[1]);
          }
        }
        
        return {
          totalEpisodes,
          status: 'ongoing', // Default status
          image: imageUrl
        };
      });

      await page.close();
      
      return details;
    } catch (error) {
      console.error('Failed to get anime details:', error);
      return { totalEpisodes: 0, status: 'unknown', image: null };
    }
  }

  async checkForUpdates() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    // Checking for new episodes...
    
    try {
      // Only check animes that don't have new episodes
      const animes = await this.dbManager.getAnimeRepository().findAnimesWithoutNewEpisodes();
      const updates = [];
      
      for (const anime of animes) {
        try {
          // Checking anime: title, current episode, total episodes, URL
          
          // Skip if already completed
          if (anime.totalEpisodes > 0 && anime.currentEpisode >= anime.totalEpisodes) {
            // Anime already completed, skipping
            continue;
          }
          
          // Check for next episode using multiple methods
          const nextEpisode = anime.currentEpisode + 1;
          // Looking for next episode
          
          // Method 1: Direct URL check
          const episodeResult = await this.checkEpisodeExists(anime.url, nextEpisode, anime.totalEpisodes);
          
          if (episodeResult.found) {
            // Found new episode
            console.log(`✅ Found episode via direct URL: ${episodeResult.url}`);
            
            // Update has_new_episode flag in database
            await this.dbManager.getAnimeRepository().updateNewEpisodeStatus(anime.id, true);
            
            updates.push({
              anime: anime,
              newEpisode: nextEpisode,
              episodeUrl: episodeResult.url // Include the actual URL
            });
          } else {
            // Episode not found
            
            // Method 2: Check anime page for latest episodes (fallback) - but be more conservative
            // Trying fallback method: scanning anime page
            const latestEpisode = await this.getLatestEpisode(anime.url);
            // Latest episode found on anime page
            
            // Only trust the fallback if it's reasonable and within expected range
            if (latestEpisode > anime.currentEpisode && latestEpisode <= (anime.totalEpisodes || 100)) {
              // Found newer episodes via page scan
              console.log(`✅ Fallback found newer episode ${latestEpisode} for ${anime.title}`);
              
              // Generate the correct URL for the found episode
              let animeId = anime.url.includes('/anime/') ? anime.url.split('/anime/')[1] : anime.url.split('/').pop();
              animeId = animeId.split('?')[0].replace(/\/$/, '');
              
              let episodeUrl;
              if (anime.totalEpisodes && latestEpisode === anime.totalEpisodes) {
                // Final episode - try -final first
                episodeUrl = `https://www.turkanime.co/video/${animeId}-${latestEpisode}-bolum-final`;
              } else {
                // Regular episode
                episodeUrl = `https://www.turkanime.co/video/${animeId}-${latestEpisode}-bolum`;
              }
              
              // Update has_new_episode flag in database
              await this.dbManager.getAnimeRepository().updateNewEpisodeStatus(anime.id, true);
              
              updates.push({
                anime: anime,
                newEpisode: latestEpisode,
                episodeUrl: episodeUrl
              });
            } else if (latestEpisode > 0) {
              // Fallback found episode but it seems unrealistic - ignoring
            }
          }
          
          // Update last checked time
          await this.dbManager.getAnimeRepository().updateLastChecked(anime.id);
          
        } catch (error) {
          console.error(`Failed to check ${anime.title}:`, error);
        }
        
        // Add delay between checks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Update check completed
      // Found new episodes
      if (updates.length > 0) {
        // List of updated anime titles and episodes
        
        // Show notification if enabled in settings
        if (this.settings.notifications) {
          if (updates.length === 1) {
            this.showNotification(
              'Yeni Bölüm!', 
              `${updates[0].anime.title} - ${updates[0].newEpisode}. Bölüm`
            );
          } else {
            this.showNotification(
              'Yeni Bölümler!', 
              `${updates.length} anime için yeni bölüm bulundu`
            );
          }
        }
      }
      
      return updates;
      
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return [];
    } finally {
      this.isChecking = false;
    }
  }

  // Check for updates for a single anime
  async checkSingleAnimeUpdate(animeId) {
    // Checking single anime update for ID
    
    try {
      const animes = await this.dbManager.getAnimeRepository().findAll();
      const anime = animes.find(a => a.id === animeId);
      
      if (!anime) {
        // Anime with ID not found
        return [];
      }
      
      // Checking anime (single check): title, current episode, total episodes
      
      // Skip if already completed
      if (anime.totalEpisodes > 0 && anime.currentEpisode >= anime.totalEpisodes) {
        // Anime already completed, no more episodes expected
        return [];
      }
      
      // Check for next episode
      const nextEpisode = anime.currentEpisode + 1;
      // Logger message removed
      
      const episodeResult = await this.checkEpisodeExists(anime.url, nextEpisode, anime.totalEpisodes);
      
      if (episodeResult.found) {
        console.log(`✅ Found episode via direct URL: ${episodeResult.url}`);
        
        // Update has_new_episode flag in database
        await this.dbManager.getAnimeRepository().setNewEpisodeFlag(anime.id, true);
        
        return [{
          anime: anime,
          newEpisode: nextEpisode,
          episodeUrl: episodeResult.url // Include the actual URL
        }];
      } else {
        // Direct URL check failed, try fallback method
        console.log(`🔄 Direct URL check failed for ${anime.title}, trying fallback method...`);
        
        const latestEpisode = await this.getLatestEpisode(anime.url);
        console.log(`🔍 Fallback found latest episode: ${latestEpisode} for ${anime.title}`);
        
        // Only trust the fallback if it's reasonable and within expected range
        if (latestEpisode > anime.currentEpisode && latestEpisode <= (anime.totalEpisodes || 100)) {
          console.log(`✅ Fallback episode ${latestEpisode} is valid for ${anime.title}`);
          
          // Generate the correct URL for the found episode
          let animeId = anime.url.includes('/anime/') ? anime.url.split('/anime/')[1] : anime.url.split('/').pop();
          animeId = animeId.split('?')[0].replace(/\/$/, '');
          
          let episodeUrl;
          if (anime.totalEpisodes && latestEpisode === anime.totalEpisodes) {
            // Final episode - try -final first
            episodeUrl = `https://www.turkanime.co/video/${animeId}-${latestEpisode}-bolum-final`;
          } else {
            // Regular episode
            episodeUrl = `https://www.turkanime.co/video/${animeId}-${latestEpisode}-bolum`;
          }
          
          // Update has_new_episode flag in database
          await this.dbManager.getAnimeRepository().setNewEpisodeFlag(anime.id, true);
          
          return [{
            anime: anime,
            newEpisode: latestEpisode,
            episodeUrl: episodeUrl
          }];
        } else if (latestEpisode > 0) {
          console.log(`❌ Fallback episode ${latestEpisode} seems unrealistic for ${anime.title}, ignoring`);
        } else {
          console.log(`❌ No episodes found via fallback for ${anime.title}`);
        }
        
        return [];
      }
      
    } catch (error) {
      console.error('Failed to check single anime:', error);
      return [];
    }
  }

  // Check if specific episode exists using TurkAnime URL pattern
  async checkEpisodeExists(animeUrl, episodeNumber, totalEpisodes = null) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      // Extract anime ID from URL with multiple patterns
      let animeId = null;
      
      // Try different URL patterns
      if (animeUrl.includes('/anime/')) {
        animeId = animeUrl.split('/anime/')[1];
      } else if (animeUrl.includes('/tanitim/')) {
        animeId = animeUrl.split('/tanitim/')[1];
      } else {
        // Extract from end of URL
        const urlParts = animeUrl.split('/').filter(part => part.length > 0);
        animeId = urlParts[urlParts.length - 1];
      }
      
      // Clean up anime ID (remove any query parameters or trailing slashes)
      if (animeId) {
        animeId = animeId.split('?')[0].replace(/\/$/, '');
      }
      
      if (!animeId) {
        console.log(`❌ Could not extract anime ID from URL: ${animeUrl}`);
        return false;
      }
      
      // Determine if this might be the final episode
      const isFinalEpisode = totalEpisodes && episodeNumber === totalEpisodes;
      
      // Create URL variants to try
      const urlsToTry = [];
      
      if (isFinalEpisode) {
        // For final episodes, try -final version first
        urlsToTry.push(`https://www.turkanime.co/video/${animeId}-${episodeNumber}-bolum-final`);
        urlsToTry.push(`https://www.turkanime.co/video/${animeId}-${episodeNumber}-bolum`);
      } else {
        // For regular episodes, try normal version
        urlsToTry.push(`https://www.turkanime.co/video/${animeId}-${episodeNumber}-bolum`);
      }
      
      console.log(`🔍 Checking episode ${episodeNumber} for anime: ${animeId}`);
      console.log(`📝 Total episodes known: ${totalEpisodes || 'unknown'}`);
      console.log(`🎯 Is final episode: ${isFinalEpisode}`);
      
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Try each URL variant
      for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
        const episodeUrl = urlsToTry[urlIndex];
        console.log(`🌐 Trying URL ${urlIndex + 1}/${urlsToTry.length}: ${episodeUrl}`);
        
        try {
          // Try to navigate to episode page
          const response = await page.goto(episodeUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 8000 
          });
          
          const status = response.status();
          console.log(`📡 Response status: ${status}`);
          
          // Check if page exists (not 404 or 500)
          if (status === 200) {
            // Check page content to verify it's actually an episode page
            const isEpisodePage = await page.evaluate(() => {
              // Look for video player or episode content indicators
              const videoIndicators = [
                'video', 
                '.video-player', 
                '.player', 
                '[id*="player"]',
                '.video-container',
                'iframe[src*="player"]',
                '.episode-content',
                '.video-embed'
              ];
              
              const hasVideoIndicator = videoIndicators.some(selector => 
                document.querySelector(selector) !== null
              );
              
              // Also check if the page content suggests it's an episode
              const pageText = document.body.textContent.toLowerCase();
              const hasEpisodeContent = pageText.includes('bölüm') || 
                                       pageText.includes('episode') ||
                                       pageText.includes('video') ||
                                       pageText.includes('izle');
              
              // Check if it's not an error page
              const isNotErrorPage = !pageText.includes('bulunamadı') &&
                                    !pageText.includes('404') &&
                                    !pageText.includes('hata');
              
              return hasVideoIndicator || (hasEpisodeContent && isNotErrorPage);
            });
            
            if (isEpisodePage) {
              console.log(`✅ Found valid episode page!`);
              await page.close();
              return { found: true, url: episodeUrl }; // Return the actual URL found
            } else {
              console.log(`❌ Page exists but doesn't seem to be a valid episode page`);
            }
          } else if (status === 404) {
            console.log(`❌ Episode not found (404)`);
          } else {
            console.log(`❌ Unexpected status code: ${status}`);
          }
          
        } catch (navError) {
          console.log(`❌ Navigation error: ${navError.message}`);
        }
      }
      
      await page.close();
      console.log(`❌ No valid episode found after trying all URL variants`);
      return { found: false, url: null };
      
    } catch (error) {
      console.error(`❌ Error in checkEpisodeExists: ${error.message}`);
      return { found: false, url: null };
    }
  }

  // Fallback method: Get latest episode by scanning anime page
  async getLatestEpisode(url) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Logger message removed
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      const episodeInfo = await page.evaluate(() => {
        let latestEpisode = 0;
        let totalEpisodes = 0;
        
        // Primary method: Look for "Bölüm Sayısı" table with "X / Y" format
        const tableRows = document.querySelectorAll('tr');
        for (let row of tableRows) {
          const cells = row.querySelectorAll('td');
          
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (cell.textContent.includes('Bölüm Sayısı')) {
              // Look for the value cell (usually 2 cells later: Label | : | Value)
              for (let j = i + 1; j < cells.length; j++) {
                const valueCell = cells[j];
                const cellText = valueCell.textContent.trim();
                
                // Look for patterns like "1 / ?", "12 / 24", "5 / ?"
                const episodeMatch = cellText.match(/(\d+)\s*\/\s*(\?|\d+)/);
                if (episodeMatch) {
                  latestEpisode = parseInt(episodeMatch[1]);
                  const totalText = episodeMatch[2];
                  
                  if (totalText !== '?') {
                    totalEpisodes = parseInt(totalText);
                  }
                  
                  return { latestEpisode, totalEpisodes };
                }
              }
            }
          }
        }
        
        // Fallback: Look for episode links (but be conservative)
        if (latestEpisode === 0) {
          const episodeLinks = document.querySelectorAll('a[href*="/video/"][href*="bolum"]');
          
          episodeLinks.forEach(link => {
            const href = link.href;
            
            // Extract episode number from URL
            const urlMatch = href.match(/(\d+)-bolum/);
            if (urlMatch) {
              const episodeNum = parseInt(urlMatch[1]);
              if (episodeNum > 0 && episodeNum <= 500 && episodeNum > latestEpisode) {
                latestEpisode = episodeNum;
              }
            }
          });
        }
        return { latestEpisode, totalEpisodes };
      });

      await page.close();
      // Logger message removed
      return episodeInfo.latestEpisode;
    } catch (error) {
      console.error("Error occurred");
      return 0;
    }
  }

  async updateEpisode(animeId, episode) {
    try {
      const animeRepo = this.dbManager.getAnimeRepository();
      await animeRepo.updateEpisode(animeId, episode);
      
      // Clear new episode flag when episode is updated
      await animeRepo.updateNewEpisodeStatus(animeId, false);
      
      // Logger message removed
    } catch (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  async updateAnimeStatus(animeId, status) {
    try {
      await this.dbManager.getAnimeRepository().updateStatus(animeId, status);
      // Logger message removed
    } catch (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  async deleteAnime(animeId) {
    try {
      await this.dbManager.getAnimeRepository().delete(animeId);
      // Logger message removed
    } catch (error) {
      console.error("Error occurred");
      throw error;
    }
  }

  async getAnimeList() {
    try {
      // Use SearchAnime use case for getting all anime
      const searchAnimeUseCase = this.useCaseManager.getUseCase('searchAnime');
      
      const result = await searchAnimeUseCase.execute({
        // Empty query returns all anime
      });
      
      return result.animes || [];
    } catch (error) {
      console.error("❌ Error getting anime list:", error);
      return [];
    }
  }

  showNotification(title, message) {
    notifier.notify({
      title: title,
      message: message,
      icon: path.join(__dirname, '..', 'assets', 'icon.png'),
      sound: true,
      wait: false,
      appName: 'Anime Takip'
    });
  }

  startAutoRefresh() {
    // AUTO-REFRESH IS NOW HANDLED BY FRONTEND FOR BETTER UI CONTROL
    // Check for updates based on settings interval
    // const intervalMs = this.settings.checkInterval * 60 * 1000;
    // this.updateInterval = setInterval(() => {
    //   this.checkForUpdates();
    // }, intervalMs);
    
    // Logger message removed
  }

  stopAutoRefresh() {
    // AUTO-REFRESH IS NOW HANDLED BY FRONTEND FOR BETTER UI CONTROL
    // if (this.updateInterval) {
    //   clearInterval(this.updateInterval);
    //   this.updateInterval = null;
    //   console.log('Auto-refresh stopped');
    // }
    // Logger message removed
  }

  async cleanup() {
    try {
      // AUTO-REFRESH IS NOW HANDLED BY FRONTEND
      // this.stopAutoRefresh();
      
      // Cleanup Use Case Manager
      if (this.useCaseManager) {
        await this.useCaseManager.cleanup();
      }
      
      console.log('✅ Anime tracker cleaned up successfully');
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    }
  }

  async getApiToken() {
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser.newPage();
      await page.goto('https://www.turkanime.co/', { waitUntil: 'networkidle2' });
      
      // Try to extract token from page scripts or meta tags
      const token = await page.evaluate(() => {
        // Look for token in script tags
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent;
          const tokenMatch = content.match(/token['"]\s*:\s*['"]([a-f0-9]+)['"]/i);
          if (tokenMatch) {
            return tokenMatch[1];
          }
        }
        
        // Look for token in meta tags
        const metaToken = document.querySelector('meta[name="csrf-token"], meta[name="token"]');
        if (metaToken) {
          return metaToken.getAttribute('content');
        }
        
        // Fallback to hardcoded token
        return '3ced9ff5b1f02a1b475768c097dbee7f';
      });

      await page.close();
      return token;
    } catch (error) {
      console.error("Error occurred");
      // Return fallback token
      return '3ced9ff5b1f02a1b475768c097dbee7f';
    }
  }

  async getAnimeCategories() {
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const token = await this.getApiToken();
      const page = await this.browser.newPage();
      
      // Set headers to match the curl request
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Accept': '*/*',
        'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://www.turkanime.co/',
        'token': token,
        'X-Requested-With': 'XMLHttpRequest',
        'Alt-Used': 'www.turkanime.co',
        'Connection': 'keep-alive'
      });

      // First visit the main page to get cookies
      await page.goto('https://www.turkanime.co/', { waitUntil: 'networkidle2' });

      // Make API request to get categories
      const categories = await page.evaluate(async (apiToken) => {
        try {
          const response = await fetch('https://www.turkanime.co/ajax/turler', {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
              'Accept': '*/*',
              'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
              'Referer': 'https://www.turkanime.co/',
              'token': apiToken,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const html = await response.text();
          
          // Parse HTML to extract category names
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const categoryNames = [];
          
          // Look for category links or text
          const links = doc.querySelectorAll('a');
          links.forEach(link => {
            const text = link.textContent.trim();
            if (text && text.length > 1 && text.length < 20) {
              categoryNames.push(text);
            }
          });
          
          // If no links found, try to extract from text content
          if (categoryNames.length === 0) {
            const textContent = doc.body.textContent;
            // This might need adjustment based on actual API response
            const matches = textContent.match(/[A-Z][a-zığşçöüİĞŞÇÖÜ]+/g);
            if (matches) {
              categoryNames.push(...matches);
            }
          }
          
          console.log('Found categories:', categoryNames);
          return categoryNames;
          
        } catch (error) {
          console.error('Categories API request failed:', error);
          return [];
        }
      }, token);

      await page.close();
      
      // Return categories or fallback to hardcoded list
      if (categories.length > 0) {
        // Logger message removed
        return categories;
      } else {
        // Logger message removed
        return [
          'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
          'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
          'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
          'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
          'Aile', 'Çocuk'
        ];
      }
    } catch (error) {
      console.error("Error occurred");
      // Return fallback categories
      return [
        'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
        'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
        'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
        'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
        'Aile', 'Çocuk'
      ];
    }
  }

  // Get categories from database
  async getCategoriesFromDB() {
    try {
      const userSettingsRepo = this.dbManager.getUserSettingsRepository();
      const categories = await userSettingsRepo.getCategories();
      
      // If no categories in database, load default ones
      if (categories.length === 0) {
        const defaultCategories = [
          'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
          'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
          'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
          'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
          'Aile', 'Çocuk'
        ];
        
        await userSettingsRepo.saveCategories(defaultCategories);
        return defaultCategories;
      }
      
      return categories;
    } catch (error) {
      console.error("Error occurred");
      // Return fallback categories
      return [
        'Aksiyon', 'Dram', 'Komedi', 'Romantik', 'Fantastik', 'Macera', 'Gizem', 
        'Bilim Kurgu', 'Supernatural', 'Seinen', 'Shounen', 'Shoujo', 'Josei', 
        'Ecchi', 'Harem', 'Slice of Life', 'Okul', 'Spor', 'Müzik', 'Tarih', 
        'Askeri', 'Polis', 'Gerilim', 'Korku', 'Yaoi', 'Yuri', 'Mecha', 'Uzay', 
        'Aile', 'Çocuk'
      ];
    }
  }

  // Update categories from TurkAnime API
  async updateCategoriesFromAPI() {
    try {
      // Check if database is initialized
      if (!this.dbManager || !this.dbManager.isReady()) {
        throw new Error('Database not initialized');
      }
      
      // Logger message removed
      const categories = await this.getAnimeCategories();
      
      if (categories.length > 0) {
        const userSettingsRepo = this.dbManager.getUserSettingsRepository();
        await userSettingsRepo.saveCategories(categories);
        // Logger message removed
        return { success: true, count: categories.length };
      } else {
        // Logger message removed
        return { success: false, error: 'No categories received from API' };
      }
    } catch (error) {
      console.error("Error updating categories:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AnimeTracker;
