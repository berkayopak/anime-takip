/**
 * UserSettings Entity - Kullanıcı ayarları ve tercihleri için domain model
 * 
 * Mevcut database.js'deki settings tablosunun yapısına uygun
 */

const Validation = require('../../shared/utils/Validation');

class UserSettings {
    constructor(data = {}) {
        // Settings from database
        this.settings = data.settings || {};
        
        // Default settings
        this.defaultSettings = {
            checkInterval: 30,
            notifications: true,
            autoRefresh: true,
            theme: 'dark',
            language: 'tr',
            notificationSound: true,
            minimizeToTray: true,
            startMinimized: false,
            autoStart: false,
            updateOnStartup: true
        };
        
        // Merge defaults with current settings
        this.settings = { ...this.defaultSettings, ...this.settings };
    }

    /**
     * Ayar değeri al
     */
    getSetting(key) {
        return this.settings[key] !== undefined ? this.settings[key] : this.defaultSettings[key];
    }

    /**
     * Ayar değeri güncelle
     */
    setSetting(key, value) {
        // Tip dönüşümü
        const defaultValue = this.defaultSettings[key];
        if (defaultValue !== undefined) {
            if (typeof defaultValue === 'boolean') {
                value = Boolean(value === 'true' || value === true);
            } else if (typeof defaultValue === 'number') {
                value = parseInt(value) || defaultValue;
            } else if (typeof defaultValue === 'string') {
                value = String(value);
            }
        }
        
        this.settings[key] = value;
    }

    /**
     * Çoklu ayar güncelleme
     */
    updateSettings(newSettings) {
        for (const [key, value] of Object.entries(newSettings)) {
            this.setSetting(key, value);
        }
    }

    /**
     * Ayarları sıfırla
     */
    resetSettings() {
        this.settings = { ...this.defaultSettings };
    }

    /**
     * Kontrol aralığını al (dakika)
     */
    get checkInterval() {
        return this.getSetting('checkInterval');
    }

    /**
     * Kontrol aralığını ayarla (dakika)
     */
    set checkInterval(minutes) {
        this.setSetting('checkInterval', Math.max(1, Math.min(1440, parseInt(minutes) || 30)));
    }

    /**
     * Bildirimler açık mı
     */
    get notificationsEnabled() {
        return this.getSetting('notifications');
    }

    /**
     * Bildirimları aç/kapat
     */
    set notificationsEnabled(enabled) {
        this.setSetting('notifications', Boolean(enabled));
    }

    /**
     * Otomatik yenileme açık mı
     */
    get autoRefreshEnabled() {
        return this.getSetting('autoRefresh');
    }

    /**
     * Otomatik yenilemeyi aç/kapat
     */
    set autoRefreshEnabled(enabled) {
        this.setSetting('autoRefresh', Boolean(enabled));
    }

    /**
     * Tema
     */
    get theme() {
        return this.getSetting('theme');
    }

    /**
     * Tema güncelle
     */
    set theme(themeName) {
        const validThemes = ['light', 'dark', 'auto'];
        if (validThemes.includes(themeName)) {
            this.setSetting('theme', themeName);
        }
    }

    /**
     * Dil
     */
    get language() {
        return this.getSetting('language');
    }

    /**
     * Dil güncelle
     */
    set language(lang) {
        const validLanguages = ['tr', 'en'];
        if (validLanguages.includes(lang)) {
            this.setSetting('language', lang);
        }
    }

    /**
     * Bildirim sesi açık mı
     */
    get notificationSoundEnabled() {
        return this.getSetting('notificationSound');
    }

    /**
     * Bildirim sesini aç/kapat
     */
    set notificationSoundEnabled(enabled) {
        this.setSetting('notificationSound', Boolean(enabled));
    }

    /**
     * Sistem tepsisine küçült
     */
    get minimizeToTrayEnabled() {
        return this.getSetting('minimizeToTray');
    }

    /**
     * Sistem tepsisine küçültmeyi aç/kapat
     */
    set minimizeToTrayEnabled(enabled) {
        this.setSetting('minimizeToTray', Boolean(enabled));
    }

    /**
     * Küçük olarak başlat
     */
    get startMinimizedEnabled() {
        return this.getSetting('startMinimized');
    }

    /**
     * Küçük olarak başlatmayı aç/kapat
     */
    set startMinimizedEnabled(enabled) {
        this.setSetting('startMinimized', Boolean(enabled));
    }

    /**
     * Otomatik başlatma
     */
    get autoStartEnabled() {
        return this.getSetting('autoStart');
    }

    /**
     * Otomatik başlatmayı aç/kapat
     */
    set autoStartEnabled(enabled) {
        this.setSetting('autoStart', Boolean(enabled));
    }

    /**
     * Başlangıçta güncelle
     */
    get updateOnStartupEnabled() {
        return this.getSetting('updateOnStartup');
    }

    /**
     * Başlangıçta güncellemeyi aç/kapat
     */
    set updateOnStartupEnabled(enabled) {
        this.setSetting('updateOnStartup', Boolean(enabled));
    }

    /**
     * Validasyon
     */
    validate() {
        const validator = new Validation();
        
        const rules = {
            checkInterval: ['integer', 'min:1', 'max:1440'],
            notifications: ['boolean'],
            autoRefresh: ['boolean'],
            theme: ['in:light,dark,auto'],
            language: ['in:tr,en']
        };

        return validator.validate({
            checkInterval: this.checkInterval,
            notifications: this.notificationsEnabled,
            autoRefresh: this.autoRefreshEnabled,
            theme: this.theme,
            language: this.language
        }, rules);
    }

    /**
     * Database format için settings'leri hazırla
     */
    getSettingsForDb() {
        const dbSettings = [];
        
        for (const [key, value] of Object.entries(this.settings)) {
            dbSettings.push({
                key,
                value: String(value)
            });
        }
        
        return dbSettings;
    }

    /**
     * JSON için serilaştırma
     */
    toJSON() {
        return {
            settings: this.settings,
            checkInterval: this.checkInterval,
            notificationsEnabled: this.notificationsEnabled,
            autoRefreshEnabled: this.autoRefreshEnabled,
            theme: this.theme,
            language: this.language,
            notificationSoundEnabled: this.notificationSoundEnabled,
            minimizeToTrayEnabled: this.minimizeToTrayEnabled,
            startMinimizedEnabled: this.startMinimizedEnabled,
            autoStartEnabled: this.autoStartEnabled,
            updateOnStartupEnabled: this.updateOnStartupEnabled
        };
    }

    /**
     * Clone user
     */
    clone() {
        return new User({ settings: { ...this.settings } });
    }

    /**
     * Static factory methods
     */
    static fromDbRows(rows) {
        const settings = {};
        
        rows.forEach(row => {
            let value = row.value;
            
            // Boolean dönüşümü
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            // Sayı dönüşümü
            else if (!isNaN(value) && !isNaN(parseFloat(value))) {
                value = parseFloat(value);
            }
            
            settings[row.key] = value;
        });
        
        return new User({ settings });
    }

    static createDefault() {
        return new User();
    }
}

module.exports = UserSettings;
