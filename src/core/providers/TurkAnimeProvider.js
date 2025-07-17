/**
 * TurkAnimeProvider - TurkAnime.co sitesi için özel provider
 * 
 * AnimeProvider'dan türetilen bu sınıf, TurkAnime.co sitesinin
 * API'leriyle etkileşim kurar ve veri çeker.
 */

const AnimeProvider = require('./AnimeProvider');
const puppeteer = require('puppeteer');

class TurkAnimeProvider extends AnimeProvider {
    constructor() {
        super('turkanime');
        this.browser = null;
    }

    /**
     * Browser'ı başlat
     */
    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
        }
    }

    /**
     * Browser'ı kapat
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * API token'ını al
     */
    async getApiToken() {
        try {
            if (!this.browser) {
                await this.initializeBrowser();
            }

            const page = await this.browser.newPage();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            const token = await page.evaluate(() => {
                const scriptTags = document.getElementsByTagName('script');
                for (let script of scriptTags) {
                    const content = script.innerHTML;
                    const tokenMatch = content.match(/token['"]\s*:\s*['"]([^'"]+)['"]/);
                    if (tokenMatch) {
                        return tokenMatch[1];
                    }
                }
                return null;
            });

            await page.close();
            return token;
        } catch (error) {
            this.handleError(error, 'getApiToken');
        }
    }

    /**
     * Kategorileri çek
     */
    async getCategories() {
        try {
            if (!this.browser) {
                await this.initializeBrowser();
            }

            const token = await this.getApiToken();
            const page = await this.browser.newPage();
            
            // Headers'ı ayarla
            await page.setExtraHTTPHeaders({
                ...this.buildHeaders({
                    'Referer': this.baseUrl + '/',
                    'token': token
                })
            });

            // Ana sayfayı ziyaret et (cookie'ler için)
            await page.goto(this.baseUrl + '/', { waitUntil: 'networkidle2' });

            // Kategorileri çek
            const categories = await page.evaluate(async (apiUrl, headers) => {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: headers
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const html = await response.text();
                    
                    // HTML'i parse et
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const categoryNames = [];
                    
                    // Kategori linklerini ara
                    const links = doc.querySelectorAll('a');
                    links.forEach(link => {
                        const text = link.textContent.trim();
                        if (text && text.length > 1 && text.length < 20) {
                            categoryNames.push(text);
                        }
                    });
                    
                    // Eğer link bulunamazsa, text content'ten çıkar
                    if (categoryNames.length === 0) {
                        const textContent = doc.body.textContent;
                        const matches = textContent.match(/[A-Z][a-zığşçöüİĞŞÇÖÜ]+/g);
                        if (matches) {
                            categoryNames.push(...matches);
                        }
                    }
                    
                    return categoryNames;
                    
                } catch (error) {
                    console.error('Categories API request failed:', error);
                    return [];
                }
            }, this.buildApiUrl('CATEGORIES'), this.buildHeaders({
                'Referer': this.baseUrl + '/',
                'token': token
            }));

            await page.close();
            
            if (categories.length > 0) {
                this.logSuccess(`Retrieved ${categories.length} categories`);
                return categories;
            } else {
                this.logger.warn(`[${this.providerId}] No categories found, using fallback`);
                return AnimeConstants.FALLBACK_GENRES;
            }
            
        } catch (error) {
            this.handleError(error, 'getCategories');
            return AnimeConstants.FALLBACK_GENRES;
        }
    }

    /**
     * Anime listesini çek
     */
    async getAnimeList(options = {}) {
        try {
            if (!this.browser) {
                await this.initializeBrowser();
            }

            const token = await this.getApiToken();
            const page = await this.browser.newPage();
            
            // Rate limiting
            await this.enforceRateLimit();

            // Headers'ı ayarla
            await page.setExtraHTTPHeaders({
                ...this.buildHeaders({
                    'Referer': this.baseUrl + '/',
                    'token': token
                })
            });

            // Ana sayfayı ziyaret et
            await page.goto(this.baseUrl + '/', { waitUntil: 'networkidle2' });

            // Anime listesini çek
            const response = await page.evaluate(async (apiUrl, headers) => {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: headers
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    return await response.text();
                } catch (error) {
                    return null;
                }
            }, this.buildApiUrl('ANIME_LIST'), this.buildHeaders({
                'Referer': this.baseUrl + '/',
                'token': token
            }));

            await page.close();

            if (!response) {
                throw new Error('Failed to fetch anime list');
            }

            this.logSuccess('Retrieved anime list successfully');
            return response;
            
        } catch (error) {
            this.handleError(error, 'getAnimeList');
            return null;
        }
    }

    /**
     * Anime ara (henüz implement edilmedi)
     */
    async searchAnime(query, options = {}) {
        // TurkAnime'de arama endpoint'i henüz tespit edilmedi
        // İleride /ajax/arama gibi bir endpoint bulunduğunda implement edilecek
        throw new Error('Search functionality not yet implemented for TurkAnime');
    }

    /**
     * Anime detaylarını çek (henüz implement edilmedi)
     */
    async getAnimeDetails(animeId) {
        // İleride implement edilecek
        throw new Error('Anime details functionality not yet implemented for TurkAnime');
    }

    /**
     * Bölüm listesini çek (henüz implement edilmedi)
     */
    async getEpisodeList(animeId) {
        // İleride implement edilecek
        throw new Error('Episode list functionality not yet implemented for TurkAnime');
    }
}

module.exports = TurkAnimeProvider;
