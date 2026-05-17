// electron/utils/NotificationService.cjs
'use strict';

const notifier = require('node-notifier');
const path = require('path');

class NotificationService {
  constructor() {
    this._enabled = { fatal: true, anr: true, disconnect: true, custom: true };
    this._cooldowns = new Map(); // prevent spam
  }

  notify(title, message, category = 'custom') {
    if (!this._enabled[category] && !this._enabled.custom) return;

    const key = `${title}:${message.slice(0, 30)}`;
    const now = Date.now();
    if (this._cooldowns.has(key) && now - this._cooldowns.get(key) < 5000) return;
    this._cooldowns.set(key, now);

    notifier.notify({
      title: `Smart Logcat — ${title}`,
      message: message.slice(0, 120),
      sound: false,
      timeout: 5,
    });
  }

  setEnabled(category, value) {
    this._enabled[category] = value;
  }
}

module.exports = { NotificationService };
