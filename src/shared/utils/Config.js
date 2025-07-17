/**
 * Config - Configuration Management System
 * Environment-based configuration with validation
 */

const path = require('path');
const fs = require('fs');

class Config {
    constructor() {
        this.config = {};
        this.watchers = new Map();
        this.environment = process.env.NODE_ENV || 'development';
        this.configPath = this._getConfigPath();
        
        this._loadConfig();
        this._watchConfigFile();
    }

    /**
     * Configuration değeri al
     * @param {string} key - Config key (dot notation destekli)
     * @param {*} defaultValue - Default değer
     */
    get(key, defaultValue = null) {
        return this._getNestedValue(this.config, key, defaultValue);
    }

    /**
     * Configuration değeri set et
     * @param {string} key - Config key
     * @param {*} value - Değer
     */
    set(key, value) {
        this._setNestedValue(this.config, key, value);
        this._saveConfig();
        this._notifyWatchers(key, value);
        return this;
    }

    /**
     * Environment-specific config al
     * @param {string} key - Config key
     * @param {*} defaultValue - Default değer
     */
    getEnv(key, defaultValue = null) {
        const envKey = `${this.environment}.${key}`;
        return this.get(envKey, this.get(key, defaultValue));
    }

    /**
     * Config key var mı kontrol et
     * @param {string} key - Config key
     */
    has(key) {
        return this._getNestedValue(this.config, key, Symbol('not-found')) !== Symbol('not-found');
    }

    /**
     * Config key'i sil
     * @param {string} key - Config key
     */
    delete(key) {
        this._deleteNestedValue(this.config, key);
        this._saveConfig();
        this._notifyWatchers(key, undefined);
        return this;
    }

    /**
     * Tüm config'i al
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Environment bazlı config'i al
     */
    getEnvironmentConfig() {
        return this.get(this.environment, {});
    }

    /**
     * Config değişikliklerini izle
     * @param {string} key - İzlenecek key
     * @param {Function} callback - Callback fonksiyonu
     */
    watch(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, []);
        }
        
        const watcherId = `watcher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.watchers.get(key).push({ id: watcherId, callback });
        
        return watcherId;
    }

    /**
     * Config watcher'ı kaldır
     * @param {string} key - Key
     * @param {string} watcherId - Watcher ID
     */
    unwatch(key, watcherId) {
        if (this.watchers.has(key)) {
            const watchers = this.watchers.get(key);
            const index = watchers.findIndex(w => w.id === watcherId);
            if (index !== -1) {
                watchers.splice(index, 1);
            }
        }
        return this;
    }

    /**
     * Config'i dosyadan yeniden yükle
     */
    reload() {
        this._loadConfig();
        return this;
    }

    /**
     * Config'i validate et
     * @param {Object} schema - Validation schema
     */
    validate(schema) {
        const errors = [];
        
        for (const [key, rules] of Object.entries(schema)) {
            const value = this.get(key);
            const validationResult = this._validateValue(key, value, rules);
            
            if (!validationResult.valid) {
                errors.push(...validationResult.errors);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ============ PRIVATE METHODS ============

    /**
     * Config dosya path'ini al
     */
    _getConfigPath() {
        const userDataPath = this._getUserDataPath();
        return path.join(userDataPath, 'config.json');
    }

    /**
     * User data path al
     */
    _getUserDataPath() {
        const { app } = require('electron');
        if (app && app.getPath) {
            return app.getPath('userData');
        }
        
        // Fallback for non-electron environments
        const os = require('os');
        return path.join(os.homedir(), '.anime-takip');
    }

    /**
     * Config'i yükle
     */
    _loadConfig() {
        try {
            // Default config
            this.config = this._getDefaultConfig();
            
            // User config dosyası varsa yükle
            if (fs.existsSync(this.configPath)) {
                const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.config = this._mergeDeep(this.config, userConfig);
            }
            
            // Environment variables'ları yükle
            this._loadEnvironmentVariables();
            
        } catch (error) {
            console.error('Config loading error:', error);
            this.config = this._getDefaultConfig();
        }
    }

    /**
     * Default configuration
     */
    _getDefaultConfig() {
        return {
            // Application settings
            app: {
                name: 'Anime Takip',
                version: '1.0.0',
                debug: false,
                autoStart: false,
                minimizeToTray: true,
                closeToTray: true
            },
            
            // Window settings
            window: {
                width: 1200,
                height: 800,
                minWidth: 800,
                minHeight: 600,
                center: true,
                resizable: true,
                alwaysOnTop: false
            },
            
            // Database settings
            database: {
                filename: 'anime-takip.db',
                backupInterval: 24 * 60 * 60 * 1000, // 24 hours
                maxBackups: 5,
                autoVacuum: true
            },
            
            // Scraping settings
            scraping: {
                interval: 60 * 60 * 1000, // 1 hour
                timeout: 30000, // 30 seconds
                retryCount: 3,
                retryDelay: 5000, // 5 seconds
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                concurrent: 5
            },
            
            // Notification settings
            notifications: {
                enabled: true,
                sound: true,
                newEpisodes: true,
                syncComplete: false,
                position: 'top-right',
                duration: 5000
            },
            
            // UI settings
            ui: {
                theme: 'dark',
                language: 'tr',
                animations: true,
                compactMode: false,
                showProgress: true,
                cardsPerRow: 4
            },
            
            // Development settings
            development: {
                app: {
                    debug: true
                },
                scraping: {
                    interval: 5 * 60 * 1000, // 5 minutes
                    timeout: 60000 // 1 minute
                }
            },
            
            // Production settings
            production: {
                app: {
                    debug: false
                },
                scraping: {
                    interval: 60 * 60 * 1000, // 1 hour
                    timeout: 30000 // 30 seconds
                }
            }
        };
    }

    /**
     * Environment variables'ları yükle
     */
    _loadEnvironmentVariables() {
        const envVars = {
            'app.debug': 'ANIME_TAKIP_DEBUG',
            'scraping.interval': 'ANIME_TAKIP_SCRAPING_INTERVAL',
            'scraping.timeout': 'ANIME_TAKIP_SCRAPING_TIMEOUT',
            'notifications.enabled': 'ANIME_TAKIP_NOTIFICATIONS',
            'database.filename': 'ANIME_TAKIP_DB_FILE'
        };
        
        for (const [configKey, envKey] of Object.entries(envVars)) {
            if (process.env[envKey] !== undefined) {
                let value = process.env[envKey];
                
                // Type conversion
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value)) value = Number(value);
                
                this.set(configKey, value);
            }
        }
    }

    /**
     * Config'i kaydet
     */
    _saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            
            // Config dizini yoksa oluştur
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Config save error:', error);
        }
    }

    /**
     * Config dosyasını izle
     */
    _watchConfigFile() {
        if (fs.existsSync(this.configPath)) {
            fs.watchFile(this.configPath, (curr, prev) => {
                if (curr.mtime !== prev.mtime) {
                    this.reload();
                }
            });
        }
    }

    /**
     * Nested value getter
     */
    _getNestedValue(obj, key, defaultValue) {
        const keys = key.split('.');
        let current = obj;
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    /**
     * Nested value setter
     */
    _setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const k of keys) {
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[lastKey] = value;
    }

    /**
     * Nested value deleter
     */
    _deleteNestedValue(obj, key) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const k of keys) {
            if (!(k in current) || typeof current[k] !== 'object') {
                return;
            }
            current = current[k];
        }
        
        delete current[lastKey];
    }

    /**
     * Deep merge objects
     */
    _mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._mergeDeep(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Watcher'lara notify et
     */
    _notifyWatchers(key, value) {
        if (this.watchers.has(key)) {
            const watchers = this.watchers.get(key);
            for (const watcher of watchers) {
                try {
                    watcher.callback(value, key);
                } catch (error) {
                    console.error('Config watcher error:', error);
                }
            }
        }
    }

    /**
     * Value validation
     */
    _validateValue(key, value, rules) {
        const errors = [];
        
        // Required check
        if (rules.required && (value === undefined || value === null)) {
            errors.push(`${key} is required`);
        }
        
        // Type check
        if (value !== undefined && rules.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== rules.type) {
                errors.push(`${key} must be of type ${rules.type}`);
            }
        }
        
        // Min/Max for numbers
        if (typeof value === 'number' && rules.min !== undefined && value < rules.min) {
            errors.push(`${key} must be at least ${rules.min}`);
        }
        
        if (typeof value === 'number' && rules.max !== undefined && value > rules.max) {
            errors.push(`${key} must be at most ${rules.max}`);
        }
        
        // Enum check
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Singleton instance
const config = new Config();

module.exports = config;
