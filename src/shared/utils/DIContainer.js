/**
 * DIContainer - Dependency Injection Container
 * Modern, type-safe dependency injection sistemi
 * Singleton, Transient ve Scoped lifecycle desteği
 */

class DIContainer {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.factories = new Map();
        this.scopes = new Map();
        this.currentScope = null;
        this.debugMode = false;
    }

    /**
     * Service lifetime types
     */
    static LifeTime = {
        SINGLETON: 'singleton',
        TRANSIENT: 'transient',
        SCOPED: 'scoped'
    };

    /**
     * Singleton service kaydet
     * @param {string} name - Service adı
     * @param {Function|Object} implementation - Implementasyon
     * @param {Array} dependencies - Bağımlılıklar
     */
    registerSingleton(name, implementation, dependencies = []) {
        this._register(name, implementation, dependencies, DIContainer.LifeTime.SINGLETON);
        return this;
    }

    /**
     * Transient service kaydet
     * @param {string} name - Service adı
     * @param {Function|Object} implementation - Implementasyon
     * @param {Array} dependencies - Bağımlılıklar
     */
    registerTransient(name, implementation, dependencies = []) {
        this._register(name, implementation, dependencies, DIContainer.LifeTime.TRANSIENT);
        return this;
    }

    /**
     * Scoped service kaydet
     * @param {string} name - Service adı
     * @param {Function|Object} implementation - Implementasyon
     * @param {Array} dependencies - Bağımlılıklar
     */
    registerScoped(name, implementation, dependencies = []) {
        this._register(name, implementation, dependencies, DIContainer.LifeTime.SCOPED);
        return this;
    }

    /**
     * Factory fonksiyonu kaydet
     * @param {string} name - Service adı
     * @param {Function} factory - Factory fonksiyonu
     * @param {string} lifetime - Yaşam döngüsü
     */
    registerFactory(name, factory, lifetime = DIContainer.LifeTime.TRANSIENT) {
        this.factories.set(name, { factory, lifetime });
        
        if (this.debugMode) {
            console.log(`[DIContainer] Factory registered: ${name} (${lifetime})`);
        }
        
        return this;
    }

    /**
     * Service instance kaydet (hazır nesne)
     * @param {string} name - Service adı
     * @param {Object} instance - Hazır instance
     */
    registerInstance(name, instance) {
        this.instances.set(name, instance);
        
        if (this.debugMode) {
            console.log(`[DIContainer] Instance registered: ${name}`);
        }
        
        return this;
    }

    /**
     * Service resolve et
     * @param {string} name - Service adı
     */
    resolve(name) {
        if (this.debugMode) {
            console.log(`[DIContainer] Resolving: ${name}`);
        }

        // Önce hazır instance kontrol et
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        // Factory kontrol et
        if (this.factories.has(name)) {
            return this._resolveFactory(name);
        }

        // Service registration kontrol et
        if (this.services.has(name)) {
            return this._resolveService(name);
        }

        throw new Error(`Service not found: ${name}`);
    }

    /**
     * Service var mı kontrol et
     * @param {string} name - Service adı
     */
    isRegistered(name) {
        return this.services.has(name) || 
               this.instances.has(name) || 
               this.factories.has(name);
    }

    /**
     * Service'i container'dan kaldır
     * @param {string} name - Service adı
     */
    unregister(name) {
        this.services.delete(name);
        this.instances.delete(name);
        this.factories.delete(name);
        
        // Scoped instances'ları da temizle
        for (const [scopeId, scopeInstances] of this.scopes) {
            scopeInstances.delete(name);
        }

        if (this.debugMode) {
            console.log(`[DIContainer] Unregistered: ${name}`);
        }

        return this;
    }

    /**
     * Yeni scope başlat
     * @param {string} scopeId - Scope ID'si
     */
    beginScope(scopeId = null) {
        scopeId = scopeId || `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.currentScope = scopeId;
        this.scopes.set(scopeId, new Map());

        if (this.debugMode) {
            console.log(`[DIContainer] Scope started: ${scopeId}`);
        }

        return scopeId;
    }

    /**
     * Scope'u sonlandır
     * @param {string} scopeId - Scope ID'si
     */
    endScope(scopeId = null) {
        scopeId = scopeId || this.currentScope;
        
        if (this.scopes.has(scopeId)) {
            // Scope instances'ları dispose et
            const scopeInstances = this.scopes.get(scopeId);
            for (const [name, instance] of scopeInstances) {
                if (instance && typeof instance.dispose === 'function') {
                    try {
                        instance.dispose();
                    } catch (error) {
                        console.error(`[DIContainer] Error disposing ${name}:`, error);
                    }
                }
            }
            
            this.scopes.delete(scopeId);
            
            if (this.currentScope === scopeId) {
                this.currentScope = null;
            }

            if (this.debugMode) {
                console.log(`[DIContainer] Scope ended: ${scopeId}`);
            }
        }

        return this;
    }

    /**
     * Tüm services'ı temizle
     */
    clear() {
        // Tüm scope'ları sonlandır
        for (const scopeId of this.scopes.keys()) {
            this.endScope(scopeId);
        }

        // Singleton instances'ları dispose et
        for (const [name, instance] of this.instances) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                } catch (error) {
                    console.error(`[DIContainer] Error disposing ${name}:`, error);
                }
            }
        }

        this.services.clear();
        this.instances.clear();
        this.factories.clear();
        this.scopes.clear();
        this.currentScope = null;

        if (this.debugMode) {
            console.log('[DIContainer] Container cleared');
        }

        return this;
    }

    /**
     * Container istatistikleri
     */
    getStats() {
        return {
            services: this.services.size,
            instances: this.instances.size,
            factories: this.factories.size,
            scopes: this.scopes.size,
            currentScope: this.currentScope,
            registeredServices: Array.from(this.services.keys()),
            registeredInstances: Array.from(this.instances.keys()),
            registeredFactories: Array.from(this.factories.keys())
        };
    }

    /**
     * Debug mode toggle
     * @param {boolean} enabled - Debug aktif mi
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[DIContainer] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    // ============ PRIVATE METHODS ============

    /**
     * Service kaydet (internal)
     */
    _register(name, implementation, dependencies, lifetime) {
        this.services.set(name, {
            implementation,
            dependencies,
            lifetime
        });

        if (this.debugMode) {
            console.log(`[DIContainer] Service registered: ${name} (${lifetime})`);
        }
    }

    /**
     * Factory resolve et
     */
    _resolveFactory(name) {
        const factoryDef = this.factories.get(name);
        const { factory, lifetime } = factoryDef;

        if (lifetime === DIContainer.LifeTime.SINGLETON) {
            if (!this.instances.has(name)) {
                const instance = factory(this);
                this.instances.set(name, instance);
            }
            return this.instances.get(name);
        }

        if (lifetime === DIContainer.LifeTime.SCOPED && this.currentScope) {
            const scopeInstances = this.scopes.get(this.currentScope);
            if (!scopeInstances.has(name)) {
                const instance = factory(this);
                scopeInstances.set(name, instance);
            }
            return scopeInstances.get(name);
        }

        // Transient veya scope yoksa her zaman yeni instance
        return factory(this);
    }

    /**
     * Service resolve et
     */
    _resolveService(name) {
        const serviceDef = this.services.get(name);
        const { implementation, dependencies, lifetime } = serviceDef;

        if (lifetime === DIContainer.LifeTime.SINGLETON) {
            if (!this.instances.has(name)) {
                const instance = this._createInstance(implementation, dependencies);
                this.instances.set(name, instance);
            }
            return this.instances.get(name);
        }

        if (lifetime === DIContainer.LifeTime.SCOPED && this.currentScope) {
            const scopeInstances = this.scopes.get(this.currentScope);
            if (!scopeInstances.has(name)) {
                const instance = this._createInstance(implementation, dependencies);
                scopeInstances.set(name, instance);
            }
            return scopeInstances.get(name);
        }

        // Transient - her zaman yeni instance
        return this._createInstance(implementation, dependencies);
    }

    /**
     * Instance oluştur
     */
    _createInstance(implementation, dependencies) {
        if (typeof implementation === 'function') {
            // Constructor function
            const resolvedDeps = dependencies.map(dep => this.resolve(dep));
            return new implementation(...resolvedDeps);
        } else {
            // Object instance
            return implementation;
        }
    }
}

// Global container instance
const container = new DIContainer();

module.exports = { DIContainer, container };
