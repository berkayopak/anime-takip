// DesktopNotifier.js
// node-notifier wrapper for desktop notifications
// Clean Architecture: Infrastructure Service

const notifier = require('node-notifier');
const path = require('path');

class DesktopNotifier {
  constructor(options = {}) {
    this.options = options;
  }

  notify({ title, message, icon, sound = true, wait = false }) {
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: title || 'Anime Takip',
          message,
          icon: icon || path.join(__dirname, '../../assets/icon.png'),
          sound,
          wait,
          ...this.options
        },
        (err, response, metadata) => {
          if (err) return reject(err);
          resolve({ response, metadata });
        }
      );
    });
  }
}

module.exports = DesktopNotifier;
