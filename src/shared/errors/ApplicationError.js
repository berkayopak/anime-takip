/**
 * ApplicationError - Custom Error Types
 * Uygulamaya özel hata tipleri ve kategorileri
 */

/**
 * Base Application Error
 */
class ApplicationError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // Stack trace'i temizle
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Error'ı serialize et
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }

    /**
     * User-friendly mesaj
     */
    getUserMessage() {
        return this.message;
    }
}

/**
 * Validation Error
 */
class ValidationError extends ApplicationError {
    constructor(message, field = null, value = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
        this.value = value;
    }

    getUserMessage() {
        return this.field ? 
            `Geçersiz ${this.field}: ${this.message}` : 
            this.message;
    }
}

/**
 * Database Error
 */
class DatabaseError extends ApplicationError {
    constructor(message, operation = null, table = null, originalError = null) {
        super(message, 'DATABASE_ERROR', 500);
        this.operation = operation;
        this.table = table;
        this.originalError = originalError;
    }

    getUserMessage() {
        return 'Veritabanı işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

/**
 * Network Error
 */
class NetworkError extends ApplicationError {
    constructor(message, url = null, statusCode = null, timeout = false) {
        super(message, 'NETWORK_ERROR', statusCode || 503);
        this.url = url;
        this.timeout = timeout;
    }

    getUserMessage() {
        if (this.timeout) {
            return 'Bağlantı zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
        }
        return 'Ağ bağlantısı sorunu. Lütfen internet bağlantınızı kontrol edin.';
    }
}

/**
 * Scraping Error
 */
class ScrapingError extends ApplicationError {
    constructor(message, url = null, selector = null, retryCount = 0) {
        super(message, 'SCRAPING_ERROR', 422);
        this.url = url;
        this.selector = selector;
        this.retryCount = retryCount;
    }

    getUserMessage() {
        return 'Web sitesinden veri alınırken sorun oluştu. Lütfen daha sonra tekrar deneyin.';
    }
}

/**
 * File System Error
 */
class FileSystemError extends ApplicationError {
    constructor(message, path = null, operation = null) {
        super(message, 'FILESYSTEM_ERROR', 500);
        this.path = path;
        this.operation = operation;
    }

    getUserMessage() {
        switch (this.operation) {
            case 'READ':
                return 'Dosya okunamadı. Dosya var olduğundan emin olun.';
            case 'write':
                return 'Dosya yazılamadı. Disk alanı ve izinleri kontrol edin.';
            case 'delete':
                return 'Dosya silinemedi. Dosyanın kullanımda olmadığından emin olun.';
            default:
                return 'Dosya sistemi hatası oluştu.';
        }
    }
}

/**
 * Configuration Error
 */
class ConfigurationError extends ApplicationError {
    constructor(message, configKey = null, configValue = null) {
        super(message, 'CONFIGURATION_ERROR', 500);
        this.configKey = configKey;
        this.configValue = configValue;
    }

    getUserMessage() {
        return 'Uygulama yapılandırma hatası. Ayarları kontrol edin.';
    }
}

/**
 * Authentication Error
 */
class AuthenticationError extends ApplicationError {
    constructor(message, authType = null) {
        super(message, 'AUTHENTICATION_ERROR', 401);
        this.authType = authType;
    }

    getUserMessage() {
        return 'Kimlik doğrulama hatası. Lütfen giriş bilgilerinizi kontrol edin.';
    }
}

/**
 * Authorization Error
 */
class AuthorizationError extends ApplicationError {
    constructor(message, requiredPermission = null) {
        super(message, 'AUTHORIZATION_ERROR', 403);
        this.requiredPermission = requiredPermission;
    }

    getUserMessage() {
        return 'Bu işlem için yetkiniz yok.';
    }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends ApplicationError {
    constructor(message, retryAfter = null, limit = null) {
        super(message, 'RATE_LIMIT_ERROR', 429);
        this.retryAfter = retryAfter;
        this.limit = limit;
    }

    getUserMessage() {
        const waitTime = this.retryAfter ? ` ${this.retryAfter} saniye bekleyin.` : '';
        return `Çok fazla istek gönderildi.${waitTime}`;
    }
}

/**
 * Business Logic Error
 */
class BusinessLogicError extends ApplicationError {
    constructor(message, businessRule = null) {
        super(message, 'BUSINESS_LOGIC_ERROR', 422);
        this.businessRule = businessRule;
    }

    getUserMessage() {
        return this.message; // Business logic errors are usually user-friendly
    }
}

/**
 * External Service Error
 */
class ExternalServiceError extends ApplicationError {
    constructor(message, serviceName = null, serviceResponse = null) {
        super(message, 'EXTERNAL_SERVICE_ERROR', 502);
        this.serviceName = serviceName;
        this.serviceResponse = serviceResponse;
    }

    getUserMessage() {
        const service = this.serviceName ? ` (${this.serviceName})` : '';
        return `Harici servis hatası${service}. Lütfen daha sonra tekrar deneyin.`;
    }
}

/**
 * Error Factory
 * Farklı error tiplerini kolay oluşturmak için
 */
class ErrorFactory {
    /**
     * Validation error oluştur
     */
    static validation(field, message, value = null) {
        return new ValidationError(message, field, value);
    }

    /**
     * Database error oluştur
     */
    static database(operation, message, table = null, originalError = null) {
        return new DatabaseError(message, operation, table, originalError);
    }

    /**
     * Network error oluştur
     */
    static network(url, message, statusCode = null, timeout = false) {
        return new NetworkError(message, url, statusCode, timeout);
    }

    /**
     * Scraping error oluştur
     */
    static scraping(url, message, selector = null, retryCount = 0) {
        return new ScrapingError(message, url, selector, retryCount);
    }

    /**
     * File system error oluştur
     */
    static fileSystem(operation, path, message) {
        return new FileSystemError(message, path, operation);
    }

    /**
     * Configuration error oluştur
     */
    static configuration(configKey, message, configValue = null) {
        return new ConfigurationError(message, configKey, configValue);
    }

    /**
     * Business logic error oluştur
     */
    static businessLogic(businessRule, message) {
        return new BusinessLogicError(message, businessRule);
    }

    /**
     * Rate limit error oluştur
     */
    static rateLimit(message, retryAfter = null, limit = null) {
        return new RateLimitError(message, retryAfter, limit);
    }

    /**
     * External service error oluştur
     */
    static externalService(serviceName, message, serviceResponse = null) {
        return new ExternalServiceError(message, serviceName, serviceResponse);
    }
}

module.exports = {
    ApplicationError,
    ValidationError,
    DatabaseError,
    NetworkError,
    ScrapingError,
    FileSystemError,
    ConfigurationError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    BusinessLogicError,
    ExternalServiceError,
    ErrorFactory
};
