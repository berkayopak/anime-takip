/**
 * Providers - Provider sistemi için index dosyası
 * 
 * Bu dosya provider sisteminin tüm bileşenlerini export eder
 * ve kolay import için merkezi bir nokta sağlar.
 */

const AnimeProvider = require('./AnimeProvider');
const TurkAnimeProvider = require('./TurkAnimeProvider');
const { ProviderFactory, getProviderFactory } = require('./ProviderFactory');

module.exports = {
    // Base provider class
    AnimeProvider,
    
    // Concrete provider implementations
    TurkAnimeProvider,
    
    // Factory and singleton
    ProviderFactory,
    getProviderFactory,
    
    // Convenience methods
    createProvider: (providerId) => {
        const factory = getProviderFactory();
        return factory.createProvider(providerId);
    },
    
    getActiveProvider: () => {
        const factory = getProviderFactory();
        return factory.getActiveProvider();
    },
    
    switchProvider: async (providerId) => {
        const factory = getProviderFactory();
        return await factory.switchProvider(providerId);
    },
    
    getAvailableProviders: () => {
        const factory = getProviderFactory();
        return factory.getAvailableProviders();
    },
    
    healthCheckAll: async () => {
        const factory = getProviderFactory();
        return await factory.healthCheckAll();
    }
};
