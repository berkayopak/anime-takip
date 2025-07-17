/**
 * EventBus - Central Event System
 * Tüm uygulama boyunca event-driven communication sağlar
 * Modern observer pattern implementation
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debugMode = false;
    }

    /**
     * Event dinleyici ekle
     * @param {string} eventName - Event adı
     * @param {Function} callback - Callback fonksiyonu
     * @param {Object} options - Ek seçenekler
     */
    on(eventName, callback, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = {
            callback,
            priority: options.priority || 0,
            id: options.id || this._generateId()
        };

        const listeners = this.events.get(eventName);
        listeners.push(listener);
        
        // Priority'ye göre sırala (yüksek priority önce)
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`[EventBus] Listener added: ${eventName}`, listener);
        }

        return listener.id;
    }

    /**
     * Tek seferlik event dinleyici
     * @param {string} eventName - Event adı
     * @param {Function} callback - Callback fonksiyonu
     */
    once(eventName, callback) {
        const id = this._generateId();
        
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }

        this.onceEvents.get(eventName).push({ callback, id });
        return id;
    }

    /**
     * Event dinleyiciyi kaldır
     * @param {string} eventName - Event adı
     * @param {string} listenerId - Listener ID'si
     */
    off(eventName, listenerId) {
        // Normal listeners
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                if (this.debugMode) {
                    console.log(`[EventBus] Listener removed: ${eventName}`, listenerId);
                }
            }
        }

        // Once listeners
        if (this.onceEvents.has(eventName)) {
            const listeners = this.onceEvents.get(eventName);
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Event fırlat
     * @param {string} eventName - Event adı
     * @param {*} data - Event data'sı
     * @param {Object} options - Ek seçenekler
     */
    emit(eventName, data = null, options = {}) {
        const timestamp = Date.now();
        const eventData = {
            name: eventName,
            data,
            timestamp,
            source: options.source || 'unknown'
        };

        if (this.debugMode) {
            console.log(`[EventBus] Event emitted: ${eventName}`, eventData);
        }

        // Normal listeners
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            for (const listener of listeners) {
                try {
                    if (options.async) {
                        // Async execution
                        setImmediate(() => listener.callback(eventData));
                    } else {
                        // Sync execution
                        listener.callback(eventData);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in listener for ${eventName}:`, error);
                    this.emit('eventbus:error', { eventName, error, listener });
                }
            }
        }

        // Once listeners
        if (this.onceEvents.has(eventName)) {
            const listeners = this.onceEvents.get(eventName);
            for (const listener of listeners) {
                try {
                    listener.callback(eventData);
                } catch (error) {
                    console.error(`[EventBus] Error in once listener for ${eventName}:`, error);
                }
            }
            // Once listeners'ı temizle
            this.onceEvents.delete(eventName);
        }
    }

    /**
     * Promise-based event waiting
     * @param {string} eventName - Event adı
     * @param {number} timeout - Timeout (ms)
     */
    waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.off(eventName, listenerId);
                reject(new Error(`Timeout waiting for event: ${eventName}`));
            }, timeout);

            const listenerId = this.once(eventName, (eventData) => {
                clearTimeout(timeoutId);
                resolve(eventData);
            });
        });
    }

    /**
     * Tüm listeners'ı temizle
     * @param {string} eventName - Event adı (opsiyonel)
     */
    clear(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
        } else {
            this.events.clear();
            this.onceEvents.clear();
        }

        if (this.debugMode) {
            console.log(`[EventBus] Cleared: ${eventName || 'all events'}`);
        }
    }

    /**
     * Event statistics
     */
    getStats() {
        const normalEvents = Array.from(this.events.keys());
        const onceEvents = Array.from(this.onceEvents.keys());
        
        return {
            totalEvents: normalEvents.length + onceEvents.length,
            normalEvents: normalEvents.map(name => ({
                name,
                listenerCount: this.events.get(name).length
            })),
            onceEvents: onceEvents.map(name => ({
                name,
                listenerCount: this.onceEvents.get(name).length
            }))
        };
    }

    /**
     * Debug mode toggle
     * @param {boolean} enabled - Debug aktif mi
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[EventBus] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Unique ID generator
     */
    _generateId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
