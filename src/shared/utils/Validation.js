/**
 * Validation - Input Validation System
 * Comprehensive validation with custom rules
 */

const { ValidationError } = require('../errors/ApplicationError');

class Validator {
    constructor() {
        this.customRules = new Map();
        this.messages = {
            required: '{field} alanı gereklidir',
            string: '{field} metin olmalıdır',
            number: '{field} sayı olmalıdır',
            boolean: '{field} boolean olmalıdır',
            array: '{field} dizi olmalıdır',
            object: '{field} nesne olmalıdır',
            email: '{field} geçerli bir e-posta adresi olmalıdır',
            url: '{field} geçerli bir URL olmalıdır',
            min: '{field} en az {min} karakter olmalıdır',
            max: '{field} en fazla {max} karakter olmalıdır',
            minValue: '{field} en az {min} olmalıdır',
            maxValue: '{field} en fazla {max} olmalıdır',
            minLength: '{field} en az {min} öğe içermelidir',
            maxLength: '{field} en fazla {max} öğe içermelidir',
            pattern: '{field} geçerli formatta değil',
            enum: '{field} geçerli değerlerden biri olmalıdır: {values}',
            unique: '{field} benzersiz olmalıdır',
            exists: '{field} mevcut olmalıdır'
        };
    }

    /**
     * Değeri validate et
     * @param {*} value - Validate edilecek değer
     * @param {Object} rules - Validation kuralları
     * @param {string} field - Alan adı
     */
    validate(value, rules, field = 'field') {
        const errors = [];

        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const result = this._applyRule(value, ruleName, ruleValue, field);
            if (result !== true) {
                errors.push(result);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            value
        };
    }

    /**
     * Objeyi validate et
     * @param {Object} data - Validate edilecek data
     * @param {Object} schema - Validation schema
     */
    validateObject(data, schema) {
        const results = {};
        const allErrors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = this._getNestedValue(data, field);
            const result = this.validate(value, rules, field);
            
            results[field] = result;
            if (!result.valid) {
                allErrors.push(...result.errors);
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            results,
            data
        };
    }

    /**
     * Anime validation schema
     */
    getAnimeSchema() {
        return {
            name: {
                required: true,
                string: true,
                min: 1,
                max: 200
            },
            url: {
                required: true,
                url: true
            },
            image: {
                string: true,
                url: true
            },
            description: {
                string: true,
                max: 1000
            },
            genre: {
                string: true,
                max: 100
            },
            status: {
                required: true,
                enum: ['ongoing', 'completed', 'upcoming', 'dropped']
            },
            totalEpisodes: {
                number: true,
                minValue: 0,
                maxValue: 10000
            },
            watchedEpisodes: {
                required: true,
                number: true,
                minValue: 0
            },
            rating: {
                number: true,
                minValue: 0,
                maxValue: 10
            },
            tags: {
                array: true,
                maxLength: 10
            }
        };
    }

    /**
     * Episode validation schema
     */
    getEpisodeSchema() {
        return {
            animeId: {
                required: true,
                number: true,
                minValue: 1
            },
            episodeNumber: {
                required: true,
                number: true,
                minValue: 1,
                maxValue: 10000
            },
            title: {
                string: true,
                max: 200
            },
            url: {
                string: true,
                url: true
            },
            releaseDate: {
                string: true,
                pattern: /^\d{4}-\d{2}-\d{2}$/
            },
            watched: {
                required: true,
                boolean: true
            },
            watchedAt: {
                string: true
            }
        };
    }

    /**
     * User settings validation schema
     */
    getUserSettingsSchema() {
        return {
            'notifications.enabled': {
                boolean: true
            },
            'notifications.sound': {
                boolean: true
            },
            'scraping.interval': {
                number: true,
                minValue: 60000, // 1 minute
                maxValue: 24 * 60 * 60 * 1000 // 24 hours
            },
            'ui.theme': {
                enum: ['light', 'dark', 'auto']
            },
            'ui.language': {
                enum: ['tr', 'en']
            },
            'window.width': {
                number: true,
                minValue: 800,
                maxValue: 4000
            },
            'window.height': {
                number: true,
                minValue: 600,
                maxValue: 3000
            }
        };
    }

    /**
     * Custom validation rule ekle
     * @param {string} name - Rule adı
     * @param {Function} validator - Validator fonksiyonu
     * @param {string} message - Hata mesajı
     */
    addCustomRule(name, validator, message) {
        this.customRules.set(name, { validator, message });
        return this;
    }

    /**
     * Anime name validation (custom rule example)
     */
    addAnimeValidationRules() {
        this.addCustomRule('animeName', (value) => {
            if (typeof value !== 'string') return false;
            
            // Anime adı için özel kurallar
            const forbidden = ['test', 'demo', 'sample'];
            const normalized = value.toLowerCase().trim();
            
            if (forbidden.some(word => normalized.includes(word))) {
                return false;
            }
            
            // Minimum anlamlı karakter sayısı
            const meaningful = normalized.replace(/[^a-zA-Z0-9\u00C0-\u017F\u0100-\u017F]/g, '');
            return meaningful.length >= 2;
        }, '{field} geçerli bir anime adı olmalıdır');

        this.addCustomRule('turkAnimeUrl', (value) => {
            if (typeof value !== 'string') return false;
            return value.includes('turkanime.co') || value.includes('turkanime.net');
        }, '{field} TurkAnime sitesinden bir URL olmalıdır');

        return this;
    }

    /**
     * Async validation desteği
     * @param {*} value - Değer
     * @param {Object} rules - Rules
     * @param {string} field - Field name
     */
    async validateAsync(value, rules, field = 'field') {
        const errors = [];

        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const result = await this._applyRuleAsync(value, ruleName, ruleValue, field);
            if (result !== true) {
                errors.push(result);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            value
        };
    }

    /**
     * Validation error fırlat
     * @param {Object} validationResult - Validation sonucu
     * @param {string} field - Field name
     */
    throwIfInvalid(validationResult, field = null) {
        if (!validationResult.valid) {
            throw new ValidationError(
                validationResult.errors[0],
                field,
                validationResult.value
            );
        }
    }

    // ============ PRIVATE METHODS ============

    /**
     * Validation rule uygula
     */
    _applyRule(value, ruleName, ruleValue, field) {
        switch (ruleName) {
            case 'required':
                return this._validateRequired(value, ruleValue, field);
            case 'string':
                return this._validateString(value, ruleValue, field);
            case 'number':
                return this._validateNumber(value, ruleValue, field);
            case 'boolean':
                return this._validateBoolean(value, ruleValue, field);
            case 'array':
                return this._validateArray(value, ruleValue, field);
            case 'object':
                return this._validateObject(value, ruleValue, field);
            case 'email':
                return this._validateEmail(value, ruleValue, field);
            case 'url':
                return this._validateUrl(value, ruleValue, field);
            case 'min':
                return this._validateMin(value, ruleValue, field);
            case 'max':
                return this._validateMax(value, ruleValue, field);
            case 'minValue':
                return this._validateMinValue(value, ruleValue, field);
            case 'maxValue':
                return this._validateMaxValue(value, ruleValue, field);
            case 'minLength':
                return this._validateMinLength(value, ruleValue, field);
            case 'maxLength':
                return this._validateMaxLength(value, ruleValue, field);
            case 'pattern':
                return this._validatePattern(value, ruleValue, field);
            case 'enum':
                return this._validateEnum(value, ruleValue, field);
            default:
                return this._validateCustomRule(value, ruleName, ruleValue, field);
        }
    }

    /**
     * Async rule uygula
     */
    async _applyRuleAsync(value, ruleName, ruleValue, field) {
        // Önce sync rule'ları kontrol et
        const syncResult = this._applyRule(value, ruleName, ruleValue, field);
        if (syncResult !== true) {
            return syncResult;
        }

        // Async custom rules
        if (this.customRules.has(ruleName)) {
            const rule = this.customRules.get(ruleName);
            if (rule.validator.constructor.name === 'AsyncFunction') {
                const isValid = await rule.validator(value, ruleValue);
                if (!isValid) {
                    return this._formatMessage(rule.message, field, { value, rule: ruleValue });
                }
            }
        }

        return true;
    }

    // Built-in validation methods
    _validateRequired(value, required, field) {
        if (!required) return true;
        if (value === undefined || value === null || value === '') {
            return this._formatMessage(this.messages.required, field);
        }
        return true;
    }

    _validateString(value, required, field) {
        if (!required && (value === undefined || value === null)) return true;
        if (typeof value !== 'string') {
            return this._formatMessage(this.messages.string, field);
        }
        return true;
    }

    _validateNumber(value, required, field) {
        if (!required && (value === undefined || value === null)) return true;
        if (typeof value !== 'number' || isNaN(value)) {
            return this._formatMessage(this.messages.number, field);
        }
        return true;
    }

    _validateBoolean(value, required, field) {
        if (!required && (value === undefined || value === null)) return true;
        if (typeof value !== 'boolean') {
            return this._formatMessage(this.messages.boolean, field);
        }
        return true;
    }

    _validateArray(value, required, field) {
        if (!required && (value === undefined || value === null)) return true;
        if (!Array.isArray(value)) {
            return this._formatMessage(this.messages.array, field);
        }
        return true;
    }

    _validateObject(value, required, field) {
        if (!required && (value === undefined || value === null)) return true;
        if (typeof value !== 'object' || Array.isArray(value)) {
            return this._formatMessage(this.messages.object, field);
        }
        return true;
    }

    _validateEmail(value, required, field) {
        if (!required && !value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return this._formatMessage(this.messages.email, field);
        }
        return true;
    }

    _validateUrl(value, required, field) {
        if (!required && !value) return true;
        try {
            new URL(value);
            return true;
        } catch {
            return this._formatMessage(this.messages.url, field);
        }
    }

    _validateMin(value, min, field) {
        if (typeof value === 'string' && value.length < min) {
            return this._formatMessage(this.messages.min, field, { min });
        }
        return true;
    }

    _validateMax(value, max, field) {
        if (typeof value === 'string' && value.length > max) {
            return this._formatMessage(this.messages.max, field, { max });
        }
        return true;
    }

    _validateMinValue(value, min, field) {
        if (typeof value === 'number' && value < min) {
            return this._formatMessage(this.messages.minValue, field, { min });
        }
        return true;
    }

    _validateMaxValue(value, max, field) {
        if (typeof value === 'number' && value > max) {
            return this._formatMessage(this.messages.maxValue, field, { max });
        }
        return true;
    }

    _validateMinLength(value, min, field) {
        if (Array.isArray(value) && value.length < min) {
            return this._formatMessage(this.messages.minLength, field, { min });
        }
        return true;
    }

    _validateMaxLength(value, max, field) {
        if (Array.isArray(value) && value.length > max) {
            return this._formatMessage(this.messages.maxLength, field, { max });
        }
        return true;
    }

    _validatePattern(value, pattern, field) {
        if (typeof value === 'string' && !pattern.test(value)) {
            return this._formatMessage(this.messages.pattern, field);
        }
        return true;
    }

    _validateEnum(value, enumValues, field) {
        if (!enumValues.includes(value)) {
            return this._formatMessage(this.messages.enum, field, { values: enumValues.join(', ') });
        }
        return true;
    }

    _validateCustomRule(value, ruleName, ruleValue, field) {
        if (this.customRules.has(ruleName)) {
            const rule = this.customRules.get(ruleName);
            const isValid = rule.validator(value, ruleValue);
            if (!isValid) {
                return this._formatMessage(rule.message, field, { value, rule: ruleValue });
            }
        }
        return true;
    }

    /**
     * Message formatting
     */
    _formatMessage(template, field, params = {}) {
        let message = template.replace('{field}', field);
        
        for (const [key, value] of Object.entries(params)) {
            message = message.replace(`{${key}}`, value);
        }
        
        return message;
    }

    /**
     * Nested value getter
     */
    _getNestedValue(obj, key) {
        const keys = key.split('.');
        let current = obj;
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
}

// Singleton instance with anime-specific rules
const validator = new Validator();
validator.addAnimeValidationRules();

module.exports = { Validator, validator };
