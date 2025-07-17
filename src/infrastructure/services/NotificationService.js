const notifier = require('node-notifier');
const path = require('path');

/**
 * Notification Service
 * Handles all desktop notification operations
 */
class NotificationService {
  constructor(mainWindow = null) {
    this.mainWindow = mainWindow;
    this.isInitialized = false;
    this.iconPath = path.join(__dirname, '../../../assets/icon.png');
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    try {
      this.isInitialized = true;
      console.log('🔔 Notification Service initialized');
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  /**
   * Show new episode notification
   * @param {Object} data - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async showNewEpisodeNotification(data) {
    try {
      const notification = {
        title: data.title || 'New Episode Available!',
        message: data.message,
        icon: data.icon || this.iconPath,
        sound: data.sound !== false,
        wait: data.wait || false
      };

      notifier.notify(notification);
      
      // Send IPC event to frontend if available
      if (this.mainWindow && this.mainWindow.webContents && data.animeId) {
        this.mainWindow.webContents.send('anime-updated', {
          type: 'new-episode',
          animeId: data.animeId,
          episodeNumber: data.episodeNumber,
          episodeUrl: data.episodeUrl || null
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error showing new episode notification:', error);
      return false;
    }
  }

  /**
   * Show update complete notification
   * @param {Object} data - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async showUpdateCompleteNotification(data) {
    try {
      const notification = {
        title: data.title || 'Update Check Complete',
        message: data.message,
        icon: data.icon || this.iconPath,
        sound: false,
        wait: false
      };

      notifier.notify(notification);
      
      // Send IPC event for UI refresh
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('updates-complete', {
          totalChecked: data.totalChecked,
          updatesFound: data.updatesFound
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error showing update complete notification:', error);
      return false;
    }
  }

  /**
   * Show error notification
   * @param {Object} data - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async showErrorNotification(data) {
    try {
      const notification = {
        title: data.title || 'Error',
        message: data.message,
        icon: data.icon || this.iconPath,
        sound: true,
        wait: false
      };

      notifier.notify(notification);
      return true;
    } catch (error) {
      console.error('Error showing error notification:', error);
      return false;
    }
  }

  /**
   * Show info notification
   * @param {Object} data - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async showInfoNotification(data) {
    try {
      const notification = {
        title: data.title || 'Information',
        message: data.message,
        icon: data.icon || this.iconPath,
        sound: false,
        wait: false
      };

      notifier.notify(notification);
      return true;
    } catch (error) {
      console.error('Error showing info notification:', error);
      return false;
    }
  }

  /**
   * Show generic notification
   * @param {Object} data - Notification data
   * @returns {Promise<boolean>} - Success status
   */
  async showGenericNotification(data) {
    try {
      const notification = {
        title: data.title,
        message: data.message,
        icon: data.icon || this.iconPath,
        sound: data.sound || false,
        wait: data.wait || false
      };

      notifier.notify(notification);
      return true;
    } catch (error) {
      console.error('Error showing generic notification:', error);
      return false;
    }
  }

  /**
   * Show new anime notification (legacy method for AddAnime use case)
   * @param {string} title - Anime title
   * @param {number} episode - Episode number
   * @returns {Promise<boolean>} - Success status
   */
  async showNewAnimeNotification(title, episode) {
    return await this.showNewEpisodeNotification({
      title: 'Yeni Anime Eklendi!',
      message: `${title} - ${episode}. bölüm mevcut`
    });
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      this.isInitialized = false;
      console.log('🔔 Notification Service cleaned up');
    } catch (error) {
      console.error('Error cleaning up Notification Service:', error);
    }
  }
}

module.exports = NotificationService;
