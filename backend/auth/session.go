// Package auth handles session lifecycle: token generation, hashing,
// persistence in the sessions table, and lookup for middleware.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"crud-app/database"
	"crud-app/models"
)

const (
	TokenBytes        = 32                       // 256 bits
	CookieName        = "session_id"             // nombre de la cookie httpOnly
	StateCookieName   = "oauth_state"            // cookie temporal para CSRF
	StateTTL          = 10 * time.Minute         // vida de la cookie oauth_state
)

// GenerateToken returns a fresh URL-safe session token (base64url, 256 bits).
func GenerateToken() (string, error) {
	b := make([]byte, TokenBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// HashToken returns the lowercase hex sha256 of the token. Stored in DB
// instead of the raw token so that reading planing.db does not leak active
// sessions.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// CreateSession generates a new token, persists its hash, and returns the
// raw token (to set as cookie value) plus its expiry.
func CreateSession(userID int, ttl time.Duration) (token string, expiresAt time.Time, err error) {
	token, err = GenerateToken()
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt = time.Now().Add(ttl)
	hash := HashToken(token)
	_, err = database.GetDB().Exec(
		"INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
		userID, hash, expiresAt,
	)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}

// LookupSession finds the user behind a session token. Returns nil user
// (no error) if the token is unknown, malformed, or expired. The middleware
// treats both "unknown" and "expired" as anonymous.
func LookupSession(token string) (*models.User, error) {
	if token == "" {
		return nil, nil
	}
	hash := HashToken(token)
	var u models.User
	err := database.GetDB().QueryRow(`
		SELECT u.id, u.google_sub, u.email, u.name, u.picture_url, u.role, u.created_at, u.last_login_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
	`, hash).Scan(
		&u.ID, &u.GoogleSub, &u.Email, &u.Name, &u.PictureURL, &u.Role, &u.CreatedAt, &u.LastLoginAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// DeleteSession revokes a single session (logout). No-op if token unknown.
func DeleteSession(token string) error {
	if token == "" {
		return nil
	}
	_, err := database.GetDB().Exec(
		"DELETE FROM sessions WHERE token_hash = ?", HashToken(token),
	)
	return err
}

// PurgeExpired removes all session rows past their expiry. Cheap; safe to
// run on every login.
func PurgeExpired() {
	_, _ = database.GetDB().Exec("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP")
}

// ConstantTimeEqual compares two strings in constant time. Use for any
// user-influenced comparison that protects a security boundary (state
// token check, future HMAC checks).
func ConstantTimeEqual(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}