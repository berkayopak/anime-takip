/**
 * BaseRepository - Tüm repository'ler için abstract base class
 * 
 * Bu abstract class, tüm repository'lerin uyması gereken
 * ortak interface'i tanımlar ve ortak functionality sağlar.
 */

const Logger = require('../../shared/utils/Logger');

class BaseRepository {
    constructor(errorHandler = null) {
        if (this.constructor === BaseRepository) {
            throw new Error('BaseRepository is an abstract class and cannot be instantiated directly');
        }
        
        this.logger = Logger;
        this.errorHandler = errorHandler;
    }

    /**
     * Hata yönetimi - Alt sınıflar tarafından override edilebilir
     */
    handleError(error, operation = 'unknown') {
        // Enhanced error info
        const enhancedError = new Error(`Repository error in ${this.constructor.name}.${operation}: ${error.message}`);
        enhancedError.originalError = error;
        enhancedError.operation = operation;
        enhancedError.repository = this.constructor.name;
        
        // Log error
        this.logger.error(`[${this.constructor.name}] ${operation} failed:`, error);
        
        // Use injected error handler if available
        if (this.errorHandler) {
            this.errorHandler.handleError(enhancedError, `${this.constructor.name}.${operation}`);
        }
        
        throw enhancedError;
    }

    /**
     * Başarı logu
     */
    logSuccess(operation, result = null) {
        this.logger.info(`[${this.constructor.name}] ${operation} successful`, result);
    }

    /**
     * Validation helper
     */
    validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new Error(`${fieldName} is required`);
        }
    }

    /**
     * ID validation helper
     */
    validateId(id, fieldName = 'id') {
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            throw new Error(`Invalid ${fieldName}: ${id}`);
        }
    }

    // Abstract methods - Alt sınıflar tarafından implement edilmelidir

    /**
     * Tüm kayıtları getir
     */
    async findAll() {
        throw new Error('findAll method must be implemented by subclass');
    }

    /**
     * ID ile kayıt getir
     */
    async findById(id) {
        throw new Error('findById method must be implemented by subclass');
    }

    /**
     * Yeni kayıt oluştur
     */
    async create(entity) {
        throw new Error('create method must be implemented by subclass');
    }

    /**
     * Kayıt güncelle
     */
    async update(id, updates) {
        throw new Error('update method must be implemented by subclass');
    }

    /**
     * Kayıt sil
     */
    async delete(id) {
        throw new Error('delete method must be implemented by subclass');
    }

    /**
     * Kayıt var mı kontrol et
     */
    async exists(id) {
        try {
            const entity = await this.findById(id);
            return entity !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Toplam kayıt sayısı
     */
    async count() {
        const entities = await this.findAll();
        return entities.length;
    }
}

module.exports = BaseRepository;
