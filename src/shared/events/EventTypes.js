/**
 * EventTypes - Merkezi Event Type Tanımları
 * Tüm uygulama eventlerinin tek noktadan yönetimi
 */

const EventTypes = {
    // ============ ANIME EVENTS ============
    ANIME: {
        ADDED: 'anime:added',
        UPDATED: 'anime:updated',
        DELETED: 'anime:deleted',
        SEARCH_STARTED: 'anime:search-started',
        SEARCH_COMPLETED: 'anime:search-completed',
        SEARCH_FAILED: 'anime:search-failed',
        FILTER_CHANGED: 'anime:filter-changed',
        SORT_CHANGED: 'anime:sort-changed',
        LOADING_STARTED: 'anime:loading-started',
        LOADING_COMPLETED: 'anime:loading-completed'
    },

    // ============ EPISODE EVENTS ============
    EPISODE: {
        WATCHED: 'episode:watched',
        UNWATCHED: 'episode:unwatched',
        PROGRESS_UPDATED: 'episode:progress-updated',
        NEW_EPISODE_FOUND: 'episode:new-episode-found',
        SYNC_STARTED: 'episode:sync-started',
        SYNC_COMPLETED: 'episode:sync-completed',
        SYNC_FAILED: 'episode:sync-failed'
    },

    // ============ UI EVENTS ============
    UI: {
        TAB_CHANGED: 'ui:tab-changed',
        MODAL_OPENED: 'ui:modal-opened',
        MODAL_CLOSED: 'ui:modal-closed',
        THEME_CHANGED: 'ui:theme-changed',
        SEARCH_BOX_FOCUSED: 'ui:search-box-focused',
        SEARCH_BOX_BLURRED: 'ui:search-box-blurred',
        SEARCH_CLEARED: 'ui:search-cleared',
        REFRESH_STARTED: 'ui:refresh-started',
        REFRESH_COMPLETED: 'ui:refresh-completed'
    },

    // ============ DATABASE EVENTS ============
    DATABASE: {
        CONNECTED: 'database:connected',
        DISCONNECTED: 'database:disconnected',
        ERROR: 'database:error',
        MIGRATION_STARTED: 'database:migration-started',
        MIGRATION_COMPLETED: 'database:migration-completed',
        MIGRATION_FAILED: 'database:migration-failed',
        BACKUP_CREATED: 'database:backup-created',
        BACKUP_RESTORED: 'database:backup-restored'
    },

    // ============ SCRAPING EVENTS ============
    SCRAPING: {
        STARTED: 'scraping:started',
        COMPLETED: 'scraping:completed',
        FAILED: 'scraping:failed',
        ANIME_FOUND: 'scraping:anime-found',
        EPISODE_FOUND: 'scraping:episode-found',
        RATE_LIMITED: 'scraping:rate-limited',
        RETRY_ATTEMPT: 'scraping:retry-attempt'
    },

    // ============ NOTIFICATION EVENTS ============
    NOTIFICATION: {
        SHOW: 'notification:show',
        HIDE: 'notification:hide',
        CLICKED: 'notification:clicked',
        NEW_EPISODE: 'notification:new-episode',
        SYNC_COMPLETE: 'notification:sync-complete',
        ERROR_OCCURRED: 'notification:error-occurred'
    },

    // ============ APPLICATION EVENTS ============
    APP: {
        READY: 'app:ready',
        BEFORE_QUIT: 'app:before-quit',
        WINDOW_FOCUS: 'app:window-focus',
        WINDOW_BLUR: 'app:window-blur',
        SETTINGS_CHANGED: 'app:settings-changed',
        UPDATE_AVAILABLE: 'app:update-available',
        UPDATE_DOWNLOADED: 'app:update-downloaded'
    },

    // ============ ERROR EVENTS ============
    ERROR: {
        GLOBAL: 'error:global',
        VALIDATION: 'error:validation',
        NETWORK: 'error:network',
        DATABASE: 'error:database',
        SCRAPING: 'error:scraping',
        FILE_SYSTEM: 'error:file-system'
    },

    // ============ SYSTEM EVENTS ============
    SYSTEM: {
        MEMORY_WARNING: 'system:memory-warning',
        DISK_SPACE_LOW: 'system:disk-space-low',
        NETWORK_OFFLINE: 'system:network-offline',
        NETWORK_ONLINE: 'system:network-online',
        POWER_SUSPEND: 'system:power-suspend',
        POWER_RESUME: 'system:power-resume'
    }
};

/**
 * Event kategorilerini al
 */
EventTypes.getCategories = () => {
    return Object.keys(EventTypes).filter(key => typeof EventTypes[key] === 'object');
};

/**
 * Belirli bir kategorideki eventleri al
 * @param {string} category - Kategori adı
 */
EventTypes.getEventsByCategory = (category) => {
    if (!EventTypes[category]) {
        throw new Error(`Unknown event category: ${category}`);
    }
    return EventTypes[category];
};

/**
 * Tüm event isimlerini al
 */
EventTypes.getAllEvents = () => {
    const allEvents = [];
    const categories = EventTypes.getCategories();
    
    for (const category of categories) {
        const events = Object.values(EventTypes[category]);
        allEvents.push(...events);
    }
    
    return allEvents;
};

/**
 * Event validasyonu
 * @param {string} eventName - Kontrol edilecek event
 */
EventTypes.isValidEvent = (eventName) => {
    return EventTypes.getAllEvents().includes(eventName);
};

/**
 * Event namespace'ini al
 * @param {string} eventName - Event adı
 */
EventTypes.getNamespace = (eventName) => {
    const parts = eventName.split(':');
    return parts[0] || null;
};

/**
 * Event action'ını al
 * @param {string} eventName - Event adı
 */
EventTypes.getAction = (eventName) => {
    const parts = eventName.split(':');
    return parts[1] || null;
};

module.exports = EventTypes;
