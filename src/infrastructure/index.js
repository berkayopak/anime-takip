/**
 * Infrastructure - Infrastructure layer için index dosyası
 */

const { DatabaseManager, getDatabaseManager } = require('./DatabaseManager');
const repositories = require('./repositories');
const providers = require('../core/providers');

module.exports = {
    // Database management
    DatabaseManager,
    getDatabaseManager,
    
    // Repository implementations
    repositories,
    
    // Provider system
    providers,
    
    // Convenience methods
    createDatabaseManager: () => new DatabaseManager(),
    
    initializeDatabase: async () => {
        const dbManager = getDatabaseManager();
        await dbManager.initialize();
        return dbManager;
    }
};
