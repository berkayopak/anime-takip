const BaseUseCase = require('../BaseUseCase');

/**
 * Show Notification Use Case
 * Handles the business logic for showing desktop notifications
 */
class ShowNotification extends BaseUseCase {
  constructor(dependencies) {
    super(dependencies);
    
    // Required dependencies
    this.notificationService = dependencies.notificationService;
    this.userSettingsRepository = dependencies.userSettingsRepository;
  }

  /**
   * Execute show notification use case
   * @param {Object} input - Notification data
   * @param {string} input.type - Notification type ('new-episode', 'update-complete', 'error')
   * @param {string} input.title - Notification title
   * @param {string} input.message - Notification message
   * @param {string} input.icon - Notification icon (optional)
   * @param {Object} input.data - Additional data (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async execute(input) {
    try {
      this.validateInput(input);
      
      // 1. Check if notifications are enabled
      const settings = await this.userSettingsRepository.getSettings();
      if (!settings.notificationsEnabled) {
        return false; // Notifications disabled
      }
      
      // 2. Show notification based on type
      const result = await this.showNotificationByType(input);
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'showNotification');
    }
  }

  /**
   * Validate input for showing notification
   * @param {Object} input - Input to validate
   */
  validateInput(input) {
    super.validateInput(input);
    
    if (!input.type || typeof input.type !== 'string') {
      throw new Error('Type is required and must be a string');
    }
    
    if (!input.title || typeof input.title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    if (!input.message || typeof input.message !== 'string') {
      throw new Error('Message is required and must be a string');
    }
    
    const validTypes = ['new-episode', 'update-complete', 'error', 'info'];
    if (!validTypes.includes(input.type)) {
      throw new Error(`Type must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Show notification based on type
   * @param {Object} input - Notification input
   * @returns {Promise<boolean>} - Success status
   */
  async showNotificationByType(input) {
    const notificationData = {
      title: input.title,
      message: input.message,
      icon: input.icon || this.getDefaultIcon(input.type),
      sound: this.shouldPlaySound(input.type),
      wait: false,
      ...input.data
    };

    switch (input.type) {
      case 'new-episode':
        return await this.notificationService.showNewEpisodeNotification(notificationData);
      
      case 'update-complete':
        return await this.notificationService.showUpdateCompleteNotification(notificationData);
      
      case 'error':
        return await this.notificationService.showErrorNotification(notificationData);
      
      case 'info':
        return await this.notificationService.showInfoNotification(notificationData);
      
      default:
        return await this.notificationService.showGenericNotification(notificationData);
    }
  }

  /**
   * Get default icon for notification type
   * @param {string} type - Notification type
   * @returns {string} - Icon path
   */
  getDefaultIcon(type) {
    const iconMap = {
      'new-episode': 'assets/icon.png',
      'update-complete': 'assets/icon.png',
      'error': 'assets/icon.png',
      'info': 'assets/icon.png'
    };
    
    return iconMap[type] || 'assets/icon.png';
  }

  /**
   * Check if sound should be played for notification type
   * @param {string} type - Notification type
   * @returns {boolean} - Should play sound
   */
  shouldPlaySound(type) {
    const soundTypes = ['new-episode', 'error'];
    return soundTypes.includes(type);
  }
}

module.exports = ShowNotification;
