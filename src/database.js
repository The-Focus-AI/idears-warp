const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath = './data/ideas.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const createIdeasTable = `
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        votes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
      )
    `;

    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createIdeasTable);
        this.db.run(createNotesTable);
        this.db.run(createFilesTable, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async createIdea(id, title, description) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO ideas (id, title, description) VALUES (?, ?, ?)';
      this.db.run(sql, [id, title, description], function(err) {
        if (err) reject(err);
        else resolve({ id, title, description, votes: 0 });
      });
    });
  }

  async getAllIdeas() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ideas ORDER BY votes DESC, created_at DESC';
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getIdeaById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ideas WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async voteForIdea(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE ideas SET votes = votes + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      this.db.run(sql, [id], function(err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Idea not found'));
        else resolve({ changes: this.changes });
      });
    });
  }

  async addNote(id, ideaId, content) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO notes (id, idea_id, content) VALUES (?, ?, ?)';
      this.db.run(sql, [id, ideaId, content], function(err) {
        if (err) reject(err);
        else resolve({ id, ideaId, content });
      });
    });
  }

  async getNotesByIdeaId(ideaId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM notes WHERE idea_id = ? ORDER BY created_at ASC';
      this.db.all(sql, [ideaId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async addFile(id, ideaId, filename, originalName, filePath, mimeType, size) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO files (id, idea_id, filename, original_name, file_path, mime_type, size) VALUES (?, ?, ?, ?, ?, ?, ?)';
      this.db.run(sql, [id, ideaId, filename, originalName, filePath, mimeType, size], function(err) {
        if (err) reject(err);
        else resolve({ id, ideaId, filename, originalName, filePath, mimeType, size });
      });
    });
  }

  async getFilesByIdeaId(ideaId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM files WHERE idea_id = ? ORDER BY created_at ASC';
      this.db.all(sql, [ideaId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close(resolve);
      });
    }
  }
}

module.exports = Database;

