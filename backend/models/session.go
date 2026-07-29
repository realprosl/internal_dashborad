package models

import "time"

// Session is a row in the sessions table. The token_hash stores the
// sha256 of the session token (NOT the token itself) so that reading the
// database file does not give an attacker valid session credentials.
type Session struct {
	ID        int       `db:"id" json:"-"`
	UserID    int       `db:"user_id" json:"-"`
	TokenHash string    `db:"token_hash" json:"-"`
	ExpiresAt time.Time `db:"expires_at" json:"-"`
	CreatedAt time.Time `db:"created_at" json:"-"`
}