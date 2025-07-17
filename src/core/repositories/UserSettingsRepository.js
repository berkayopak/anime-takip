const BaseRepository = require('./BaseRepository');

/**
 * UserSettingsRepository - Abstract base class for user settings operations
 * 
 * Defines the interface for all user settings repository implementations
 */
class UserSettingsRepository extends BaseRepository {
  
  /**
   * Get a specific setting by key
   * @param {string} key - Setting key
   * @returns {Promise<any>} Setting value or null
   */
  async getSetting(key) {
    throw new Error('getSetting method must be implemented');
  }

  /**
   * Set a specific setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    throw new Error('setSetting method must be implemented');
  }

  /**
   * Get all settings as key-value pairs
   * @returns {Promise<Object>} Settings object
   */
  async getAllSettings() {
    throw new Error('getAllSettings method must be implemented');
  }

  /**
   * Update multiple settings at once
   * @param {Object} settings - Settings object with key-value pairs
   * @returns {Promise<void>}
   */
  async updateSettings(settings) {
    throw new Error('updateSettings method must be implemented');
  }

  /**
   * Delete a setting by key
   * @param {string} key - Setting key
   * @returns {Promise<void>}
   */
  async deleteSetting(key) {
    throw new Error('deleteSetting method must be implemented');
  }

  /**
   * Check if a setting exists
   * @param {string} key - Setting key
   * @returns {Promise<boolean>}
   */
  async hasSetting(key) {
    throw new Error('hasSetting method must be implemented');
  }

  /**
   * Save categories to database
   * @param {Array<string>} categories - Array of category names
   * @returns {Promise<void>}
   */
  async saveCategories(categories) {
    throw new Error('saveCategories method must be implemented');
  }

  /**
   * Get all categories from database
   * @returns {Promise<Array<string>>} Array of category names
   */
  async getCategories() {
    throw new Error('getCategories method must be implemented');
  }

  /**
   * Get categories count
   * @returns {Promise<number>} Number of categories
   */
  async getCategoriesCount() {
    throw new Error('getCategoriesCount method must be implemented');
  }
}

module.exports = UserSettingsRepository;
