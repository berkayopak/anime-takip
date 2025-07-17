// NotificationQueue.js
// Simple FIFO queue for desktop notifications

class NotificationQueue {
  constructor(notifier) {
    this.notifier = notifier;
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(notification) {
    this.queue.push(notification);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      try {
        await this.notifier.notify(notification);
        // Varsayılan olarak 2.5sn bekle, wait=true ise kullanıcı kapatana kadar bekle
        await new Promise(res => setTimeout(res, notification.wait ? 4000 : 2500));
      } catch (err) {
        // Hata olsa da sıradakine geç
      }
    }
    this.isProcessing = false;
  }
}

module.exports = NotificationQueue;
