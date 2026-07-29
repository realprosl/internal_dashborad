package database

import (
	"database/sql"
	"log"
)

// Migrate creates the auth tables if they don't exist. Idempotent — safe
// to call on every startup. Existing tables are left untouched.
func Migrate(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			google_sub    TEXT    UNIQUE NOT NULL,
			email         TEXT    UNIQUE NOT NULL,
			name          TEXT    NOT NULL DEFAULT '',
			picture_url   TEXT    NOT NULL DEFAULT '',
			role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id    INTEGER NOT NULL,
			token_hash TEXT    UNIQUE NOT NULL,
			expires_at DATETIME NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return err
		}
	}
	log.Println("Migration: users + sessions tables ensured")
	return nil
}