-- XA Note D1 Database Schema

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  tags TEXT,
  category_id TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  note_id TEXT,
  password TEXT,
  expires_at INTEGER,
  created_at INTEGER
);

-- Create trash table
CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  tags TEXT,
  category_id TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  deleted_at INTEGER
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);