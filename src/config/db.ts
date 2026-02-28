import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "../../contacts.db");

export const db = new Database(dbPath);

// Create table if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  phone_number TEXT,
  linked_id INTEGER,
  link_precedence TEXT CHECK(link_precedence IN ('primary','secondary')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_linked_id ON contacts(linked_id);
`);

export const runInTransaction = <T>(fn: () => T): T => {
    const transaction = db.transaction(fn);
    return transaction();
};