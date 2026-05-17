// electron/session/SessionManager.cjs
'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

class SessionManager {
  constructor() {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'sessions.db');
    
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        deviceId TEXT NOT NULL,
        deviceName TEXT,
        startedAt INTEGER NOT NULL,
        logs TEXT NOT NULL -- Store as JSON string
      );
    `);
  }

  async saveSession(name, deviceId, logs) {
    try {
      const id = Date.now().toString();
      const startedAt = Date.now();
      const logsJson = JSON.stringify(logs);
      
      const stmt = this.db.prepare(`
        INSERT INTO sessions (id, name, deviceId, startedAt, logs)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, name, deviceId, startedAt, logsJson);
      return { success: true, id };
    } catch (error) {
      console.error('[SessionManager] Error saving session:', error);
      return { success: false, error: error.message };
    }
  }

  async listSessions() {
    try {
      const stmt = this.db.prepare('SELECT id, name, deviceId, startedAt FROM sessions ORDER BY startedAt DESC');
      return stmt.all();
    } catch (error) {
      console.error('[SessionManager] Error listing sessions:', error);
      return [];
    }
  }

  async loadSession(id) {
    try {
      const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
      const session = stmt.get(id);
      if (session) {
        session.logs = JSON.parse(session.logs);
      }
      return session;
    } catch (error) {
      console.error('[SessionManager] Error loading session:', error);
      return null;
    }
  }

  async deleteSession(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (error) {
      console.error('[SessionManager] Error deleting session:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = { SessionManager };
