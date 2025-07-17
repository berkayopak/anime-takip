/**
 * ErrorHandler - Global Error Handling System
 * Merkezi hata yönetimi ve logging sistemi
 */

const EventTypes = require('../events/EventTypes');

class ErrorHandler {
    constructor(eventBus, logger = null) {
        this.eventBus = eventBus;
        this.logger = logger;
        this.errorCounts = new Map();
        this.suppressedErrors = new Set();
        this.maxErrorsPerType = 10;
        this.errorResetInterval = 5 * 60 * 1000; // 5 dakika
        this.isProduction = process.env.NODE_ENV === 'production';
        
        this._setupGlobalHandlers();
        this._startErrorCountReset();
    }

    // ============ INSTANCE METHODS (Advanced Features) ============

    /**
     * Hata işle
     * @param {Error} error - Hata nesnesi
     * @param {Object} context - Ek context bilgileri
     */
    handle(error, context = {}) {
        try {
            const errorInfo = this._analyzeError(error, context);
            
            // Error count kontrol et
            if (this._shouldSuppressError(errorInfo)) {
                return;
            }

            // Log error
            this._logError(errorInfo);

            // Event emit et
            this.eventBus.emit(EventTypes.ERROR.GLOBAL, errorInfo);

            // Context'e göre özel işlemler
            this._handleSpecificContext(errorInfo);

            // Error count'u artır
            this._incrementErrorCount(errorInfo.type);

        } catch (handlerError) {
            // Error handler'da bile hata olursa console'a log et
            console.error('Error in ErrorHandler:', handlerError);
            console.error('Original error:', error);
        }
    }

    /**
     * Async hata wrapper
     * @param {Function} asyncFn - Async fonksiyon
     * @param {Object} context - Context bilgileri
     */
    async wrapAsync(asyncFn, context = {}) {
        try {
            return await asyncFn();
        } catch (error) {
            this.handle(error, context);
            throw error; // Re-throw to maintain error flow
        }
    }

    /**
     * Promise rejection handler
     * @param {Function} promise - Promise
     * @param {Object} context - Context bilgileri
     */
    wrapPromise(promise, context = {}) {
        return promise.catch(error => {
            this.handle(error, context);
            throw error;
        });
    }

    /**
     * Error suppression ekle
     * @param {string} errorType - Suppress edilecek error tipi
     * @param {number} duration - Süre (ms)
     */
    suppressError(errorType, duration = 60000) {
        this.suppressedErrors.add(errorType);
        
        setTimeout(() => {
            this.suppressedErrors.delete(errorType);
        }, duration);
    }

    /**
     * Error istatistikleri
     */
    getStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
            errorsByType: Object.fromEntries(this.errorCounts),
            suppressedErrors: Array.from(this.suppressedErrors),
            isProduction: this.isProduction
        };
    }

    /**
     * Error count'ları sıfırla
     */
    resetErrorCounts() {
        this.errorCounts.clear();
    }

    // ============ PRIVATE METHODS ============

    /**
     * Error analiz et
     */
    _analyzeError(error, context) {
        const errorInfo = {
            name: error.name || 'Error',
            message: error.message || 'Unknown error',
            stack: error.stack,
            code: error.code || null,
            statusCode: error.statusCode || null,
            type: this._determineErrorType(error),
            severity: this._determineSeverity(error, context),
            context: {
                timestamp: new Date().toISOString(),
                userAgent: context.userAgent || null,
                url: context.url || null,
                userId: context.userId || null,
                sessionId: context.sessionId || null,
                component: context.component || null,
                action: context.action || null,
                ...context
            },
            fingerprint: this._generateFingerprint(error),
            userMessage: error.getUserMessage ? error.getUserMessage() : this._getGenericUserMessage(error)
        };

        return errorInfo;
    }

    /**
     * Error tipini belirle
     */
    _determineErrorType(error) {
        if (error.constructor.name !== 'Error') {
            return error.constructor.name;
        }

        // Error mesajından tip çıkarsama
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'NetworkError';
        }
        if (message.includes('database') || message.includes('sql')) {
            return 'DatabaseError';
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return 'ValidationError';
        }
        if (message.includes('timeout')) {
            return 'TimeoutError';
        }
        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'AuthorizationError';
        }

        return 'UnknownError';
    }

    /**
     * Error severity belirle
     */
    _determineSeverity(error, context) {
        // Critical errors
        if (error.code === 'ENOSPC' || error.message.includes('out of memory')) {
            return 'critical';
        }

        // High severity
        if (error.statusCode >= 500 || error.name.includes('Database')) {
            return 'high';
        }

        // Medium severity
        if (error.statusCode >= 400 || error.name.includes('Network')) {
            return 'medium';
        }

        // Low severity
        return 'low';
    }

    /**
     * Error fingerprint oluştur (aynı hataları gruplamak için)
     */
    _generateFingerprint(error) {
        const key = `${error.name}_${error.message}_${this._getStackSignature(error.stack)}`;
        return this._hash(key);
    }

    /**
     * Stack signature al (ilk 3 satır)
     */
    _getStackSignature(stack) {
        if (!stack) return '';
        
        const lines = stack.split('\n').slice(1, 4); // İlk 3 stack frame
        return lines.map(line => line.trim().split(' ')[0]).join('_');
    }

    /**
     * Simple hash function
     */
    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32-bit integer'a dönüştür
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Error suppress edilmeli mi
     */
    _shouldSuppressError(errorInfo) {
        // Suppressed error types
        if (this.suppressedErrors.has(errorInfo.type)) {
            return true;
        }

        // Rate limiting
        const currentCount = this.errorCounts.get(errorInfo.type) || 0;
        if (currentCount >= this.maxErrorsPerType) {
            return true;
        }

        return false;
    }

    /**
     * Error'ı log et
     */
    _logError(errorInfo) {
        const logLevel = this._getLogLevel(errorInfo.severity);
        const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
        
        if (this.logger) {
            this.logger[logLevel](logMessage, errorInfo);
        } else {
            // Fallback to console
            console[logLevel](logMessage, {
                context: errorInfo.context,
                stack: this.isProduction ? undefined : errorInfo.stack
            });
        }
    }

    /**
     * Log level belirle
     */
    _getLogLevel(severity) {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'error';
            case 'medium': return 'warn';
            case 'low': return 'info';
            default: return 'error';
        }
    }

    /**
     * Context'e özel işlemler
     */
    _handleSpecificContext(errorInfo) {
        switch (errorInfo.type) {
            case 'DatabaseError':
                this.eventBus.emit(EventTypes.DATABASE.ERROR, errorInfo);
                break;
            case 'NetworkError':
                this.eventBus.emit(EventTypes.ERROR.NETWORK, errorInfo);
                break;
            case 'ScrapingError':
                this.eventBus.emit(EventTypes.SCRAPING.FAILED, errorInfo);
                break;
            case 'ValidationError':
                this.eventBus.emit(EventTypes.ERROR.VALIDATION, errorInfo);
                break;
        }
    }

    /**
     * Error count artır
     */
    _incrementErrorCount(errorType) {
        const currentCount = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, currentCount + 1);
    }

    /**
     * Generic user message
     */
    _getGenericUserMessage(error) {
        switch (error.constructor.name) {
            case 'TypeError':
            case 'ReferenceError':
                return 'Bir uygulama hatası oluştu. Lütfen sayfayı yenileyin.';
            case 'SyntaxError':
                return 'Veri formatı hatası. Lütfen tekrar deneyin.';
            default:
                return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
        }
    }

    /**
     * Global error handler'ları kur
     */
    _setupGlobalHandlers() {
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handle(new Error(`Unhandled Promise Rejection: ${reason}`), {
                component: 'global',
                action: 'unhandledRejection',
                promise: promise
            });
        });

        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handle(error, {
                component: 'global',
                action: 'uncaughtException'
            });
            
            // Critical error - uygulamayı kapatma
            process.exit(1);
        });

        // Renderer process için (Electron)
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.handle(event.error, {
                    component: 'renderer',
                    action: 'windowError',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.handle(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
                    component: 'renderer',
                    action: 'unhandledRejection'
                });
            });
        }
    }

    /**
     * Error count reset timer
     */
    _startErrorCountReset() {
        setInterval(() => {
            this.resetErrorCounts();
        }, this.errorResetInterval);
    }
}

module.exports = ErrorHandler;
