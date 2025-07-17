/**
 * ProviderFactory - Anime provider'ları yönetmek için factory class
 * 
 * Bu sınıf, farklı anime provider'larını oluşturmak ve yönetmek için
 * merkezi bir nokta sağlar. Yeni provider'lar kolayca eklenebilir.
 */

const AnimeConstants = require('../../shared/constants/AnimeConstants');
const TurkAnimeProvider = require('./TurkAnimeProvider');
const Logger = require('../../shared/utils/Logger');

class ProviderFactory {
    constructor() {
        this.providers = new Map();
        this.activeProvider = null;
        this.logger = Logger;
        
        // Mevcut provider'ları kaydet
        this.registerProviders();
    }

    /**
     * Mevcut provider'ları kaydet
     */
    registerProviders() {
        // TurkAnime provider'ını kaydet
        this.registerProvider('turkanime', TurkAnimeProvider);
        
        // İleride diğer provider'lar buraya eklenecek:
        // this.registerProvider('nineanime', NineAnimeProvider);
        // this.registerProvider('animepahe', AnimePaheProvider);
        // this.registerProvider('crunchyroll', CrunchyrollProvider);
    }

    /**
     * Yeni provider kaydet
     */
    registerProvider(providerId, ProviderClass) {
        if (typeof ProviderClass !== 'function') {
            throw new Error(`Provider class must be a constructor function: ${providerId}`);
        }
        
        this.providers.set(providerId.toLowerCase(), ProviderClass);
        this.logger.info(`Provider registered: ${providerId}`);
    }

    /**
     * Provider oluştur
     */
    createProvider(providerId) {
        const normalizedId = providerId.toLowerCase();
        const ProviderClass = this.providers.get(normalizedId);
        
        if (!ProviderClass) {
            throw new Error(`Provider not found: ${providerId}. Available providers: ${this.getAvailableProviders().join(', ')}`);
        }
        
        try {
            const provider = new ProviderClass();
            this.logger.info(`Provider created: ${providerId}`);
            return provider;
        } catch (error) {
            this.logger.error(`Failed to create provider ${providerId}:`, error);
            throw error;
        }
    }

    /**
     * Aktif provider'ı ayarla
     */
    setActiveProvider(providerId) {
        const provider = this.createProvider(providerId);
        this.activeProvider = provider;
        this.logger.info(`Active provider set to: ${providerId}`);
        return provider;
    }

    /**
     * Aktif provider'ı al
     */
    getActiveProvider() {
        if (!this.activeProvider) {
            // Varsayılan provider'ı ayarla
            this.setActiveProvider(AnimeConstants.DEFAULT_PROVIDER);
        }
        return this.activeProvider;
    }

    /**
     * Aktif provider'ı değiştir
     */
    async switchProvider(providerId) {
        try {
            // Mevcut provider'ı temizle
            if (this.activeProvider) {
                if (typeof this.activeProvider.closeBrowser === 'function') {
                    await this.activeProvider.closeBrowser();
                }
            }
            
            // Yeni provider'ı ayarla
            this.setActiveProvider(providerId);
            
            this.logger.info(`Switched to provider: ${providerId}`);
            return this.activeProvider;
        } catch (error) {
            this.logger.error(`Failed to switch provider to ${providerId}:`, error);
            throw error;
        }
    }

    /**
     * Mevcut provider'ları listele
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    /**
     * Provider bilgilerini al
     */
    getProviderInfo(providerId = null) {
        if (providerId) {
            const provider = this.createProvider(providerId);
            return provider.getProviderInfo();
        }
        
        // Tüm provider'ların bilgilerini al
        const providerInfos = {};
        for (const [id, ProviderClass] of this.providers) {
            try {
                const provider = new ProviderClass();
                providerInfos[id] = provider.getProviderInfo();
            } catch (error) {
                providerInfos[id] = {
                    id: id,
                    error: error.message,
                    status: 'failed'
                };
            }
        }
        
        return providerInfos;
    }

    /**
     * Tüm provider'ların sağlık durumunu kontrol et
     */
    async healthCheckAll() {
        const results = {};
        
        for (const providerId of this.getAvailableProviders()) {
            try {
                const provider = this.createProvider(providerId);
                results[providerId] = await provider.healthCheck();
            } catch (error) {
                results[providerId] = {
                    status: 'unhealthy',
                    provider: providerId,
                    error: error.message
                };
            }
        }
        
        return results;
    }

    /**
     * En iyi çalışan provider'ı bul
     */
    async findBestProvider() {
        const healthResults = await this.healthCheckAll();
        
        // Sağlıklı provider'ları bul
        const healthyProviders = Object.entries(healthResults)
            .filter(([_, result]) => result.status === 'healthy')
            .map(([providerId, _]) => providerId);
        
        if (healthyProviders.length === 0) {
            throw new Error('No healthy providers found');
        }
        
        // İlk sağlıklı provider'ı döndür (gelecekte priority sistemi eklenebilir)
        return healthyProviders[0];
    }

    /**
     * Factory'yi temizle
     */
    async cleanup() {
        if (this.activeProvider) {
            try {
                if (typeof this.activeProvider.closeBrowser === 'function') {
                    await this.activeProvider.closeBrowser();
                }
            } catch (error) {
                this.logger.error('Error during provider cleanup:', error);
            }
        }
        
        this.activeProvider = null;
        this.logger.info('Provider factory cleaned up');
    }
}

// Singleton instance
let instance = null;

/**
 * Singleton ProviderFactory instance'ını al
 */
function getProviderFactory() {
    if (!instance) {
        instance = new ProviderFactory();
    }
    return instance;
}

module.exports = {
    ProviderFactory,
    getProviderFactory
};
