// NotificationPreferences.js
// Domain model for user notification preferences

class NotificationPreferences {
  constructor({
    enableNotifications = true,
    sound = true,
    onlyNewEpisodes = true,
    silentHours = null // ör: { start: '23:00', end: '08:00' }
  } = {}) {
    this.enableNotifications = enableNotifications;
    this.sound = sound;
    this.onlyNewEpisodes = onlyNewEpisodes;
    this.silentHours = silentHours;
  }
}

module.exports = NotificationPreferences;
