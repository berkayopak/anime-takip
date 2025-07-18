// AppState
// ...global application state management...
export default class AppState {
  constructor(ipc = null) {
    this.user = null;
    this.notifications = [];
    this.isAppReady = false;
    this.lastSync = null;
    this.ipc = ipc; // Electron IPC renderer
  }

  async loadUserSettings() {
    if (!this.ipc) return;
    try {
      const settings = await this.ipc.invoke('get-user-settings');
      this.setUser(settings);
    } catch (err) {
      // Optionally handle error
    }
  }

  async saveUserSettings() {
    if (!this.ipc || !this.user) return;
    try {
      await this.ipc.invoke('save-user-settings', this.user);
    } catch (err) {
      // Optionally handle error
    }
  }

  async loadNotifications() {
    if (!this.ipc) return;
    try {
      const notifications = await this.ipc.invoke('get-notifications');
      this.notifications = Array.isArray(notifications) ? notifications : [];
    } catch (err) {
      // Optionally handle error
    }
  }

  async sendNotification(notification) {
    if (!this.ipc) return;
    try {
      await this.ipc.invoke('send-notification', notification);
      this.addNotification(notification);
    } catch (err) {
      // Optionally handle error
    }
  }

  setUser(user) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  addNotification(notification) {
    this.notifications.push(notification);
  }

  getNotifications() {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
  }

  setAppReady(isReady) {
    this.isAppReady = !!isReady;
  }

  isReady() {
    return this.isAppReady;
  }

  setLastSync(date) {
    this.lastSync = date;
  }

  getLastSync() {
    return this.lastSync;
  }
}
