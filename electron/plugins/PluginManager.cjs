// electron/plugins/PluginManager.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class PluginManager {
  constructor() {
    this.userData = app.getPath('userData');
    this.rulesPath = path.join(this.userData, 'rules.json');
    this.rules = this.loadRules();
  }

  loadRules() {
    try {
      if (fs.existsSync(this.rulesPath)) {
        const data = fs.readFileSync(this.rulesPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[PluginManager] Error loading rules:', error);
    }
    
    // Default rules
    return [
      {
        id: 'rule_1',
        name: 'Retrofit Error',
        pattern: 'Retrofit',
        isRegex: false,
        highlightColor: '#ff6b6b',
        notify: false,
        enabled: true
      },
      {
        id: 'rule_2',
        name: 'OkHttp Failure',
        pattern: 'OkHttp',
        isRegex: false,
        highlightColor: '#feca57',
        notify: false,
        enabled: true
      }
    ];
  }

  getRules() {
    return this.rules;
  }

  saveRules(rules) {
    try {
      this.rules = rules;
      fs.writeFileSync(this.rulesPath, JSON.stringify(rules, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('[PluginManager] Error saving rules:', error);
      return { success: false, error: error.message };
    }
  }

  matchRules(entry) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      let matched = false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          matched = regex.test(entry.message) || regex.test(entry.tag);
        } catch (e) {}
      } else {
        const pattern = rule.pattern.toLowerCase();
        matched = entry.message.toLowerCase().includes(pattern) || 
                  entry.tag.toLowerCase().includes(pattern);
      }

      if (matched) {
        return rule;
      }
    }
    return null;
  }
}

module.exports = { PluginManager };
