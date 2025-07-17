// NotificationPreferencesService.js
// Service for managing user notification preferences (read/write)

const NotificationPreferences = require('../../core/entities/NotificationPreferences');
const path = require('path');
const fs = require('fs');

const PREFS_PATH = path.join(__dirname, '../../../assets/notification_prefs.json');

class NotificationPreferencesService {
  constructor() {
    this.prefs = null;
  }

  async loadPreferences() {
    try {
      if (fs.existsSync(PREFS_PATH)) {
        const raw = fs.readFileSync(PREFS_PATH, 'utf-8');
        this.prefs = new NotificationPreferences(JSON.parse(raw));
      } else {
        this.prefs = new NotificationPreferences();
        await this.savePreferences(this.prefs);
      }
      return this.prefs;
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      this.prefs = new NotificationPreferences();
      return this.prefs;
    }
  }

  async savePreferences(prefs) {
    try {
      fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2), 'utf-8');
      this.prefs = prefs;
      return true;
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      return false;
    }
  }

  getPreferences() {
    return this.prefs || new NotificationPreferences();
  }
}

module.exports = NotificationPreferencesService;
