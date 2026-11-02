import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

/**
 * Initializes and exports the SQLite database connection using better-sqlite3.
 * Preserves a single connection across hot-reloads in development via globalThis.
 */

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "taskmanager.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __sqlite_db: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (process.env.NODE_ENV === "production") {
    return createDatabase();
  }

  if (!globalThis.__sqlite_db) {
    globalThis.__sqlite_db = createDatabase();
  }
  return globalThis.__sqlite_db;
}

function createDatabase(): Database.Database {
  const db = new Database(dbPath);

  // Performance and integrity pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables and indexes
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('low', 'normal', 'high')),
      status TEXT NOT NULL CHECK(status IN ('todo', 'in_progress', 'done')),
      estimatedMinutes INTEGER,
      deadline TEXT,
      elapsedSeconds INTEGER NOT NULL DEFAULT 0,
      assigned_to TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

    CREATE TABLE IF NOT EXISTS timelogs (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_timelogs_userId ON timelogs(userId);
    CREATE INDEX IF NOT EXISTS idx_timelogs_taskId ON timelogs(taskId);
    CREATE INDEX IF NOT EXISTS idx_timelogs_startTime ON timelogs(startTime);
  `);

  return db;
}

export const db = getDatabase();
