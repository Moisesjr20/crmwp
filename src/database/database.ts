import sqlite3 from 'sqlite3';
import path from 'path';

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/crmwp.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.init();
  }

  private init() {
    // Criar tabelas se não existirem
    this.db.serialize(() => {
      // Tabela de contatos
      this.db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          phone TEXT UNIQUE NOT NULL,
          name TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de mensagens
      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          contact_id TEXT NOT NULL,
          message_id TEXT,
          content TEXT,
          type TEXT DEFAULT 'text',
          from_me BOOLEAN DEFAULT FALSE,
          timestamp DATETIME,
          status TEXT DEFAULT 'received',
          media_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contact_id) REFERENCES contacts (id)
        )
      `);

      // Tabela de configurações
      this.db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Inserir configurações padrão
      this.db.run(`
        INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('instance_status', 'disconnected'),
        ('instance_qr', ''),
        ('last_sync', '')
      `);
    });
  }

  // Métodos para contatos
  async getContacts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM contacts ORDER BY updated_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async createOrUpdateContact(phone: string, name?: string, avatar?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const contactId = `contact_${phone.replace(/\D/g, '')}`;
      
      this.db.run(
        `INSERT OR REPLACE INTO contacts (id, phone, name, avatar, updated_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [contactId, phone, name, avatar],
        function(err) {
          if (err) reject(err);
          else resolve(contactId);
        }
      );
    });
  }

  // Métodos para mensagens
  async getMessages(contactId?: string, limit: number = 50): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT m.*, c.name as contact_name, c.phone as contact_phone 
        FROM messages m 
        LEFT JOIN contacts c ON m.contact_id = c.id
      `;
      let params: any[] = [];

      if (contactId) {
        query += ' WHERE m.contact_id = ?';
        params.push(contactId);
      }

      query += ' ORDER BY m.timestamp DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createMessage(data: {
    contactId: string;
    messageId: string;
    content: string;
    type?: string;
    fromMe?: boolean;
    timestamp?: Date;
    mediaUrl?: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const messageDbId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.db.run(
        `INSERT INTO messages (id, contact_id, message_id, content, type, from_me, timestamp, media_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageDbId,
          data.contactId,
          data.messageId,
          data.content,
          data.type || 'text',
          data.fromMe || false,
          data.timestamp || new Date(),
          data.mediaUrl
        ],
        function(err) {
          if (err) reject(err);
          else resolve(messageDbId);
        }
      );
    });
  }

  // Métodos para configurações
  async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM settings WHERE key = ?',
        [key],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row ? row.value : null);
        }
      );
    });
  }

  async setSetting(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export const database = new Database(); 