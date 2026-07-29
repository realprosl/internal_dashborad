package models

import "time"

// Role values stored in users.role.
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// User represents a person authenticated via Google who may use the app.
// The google_sub is the primary identity key (immutable); email can change.
type User struct {
	ID           int       `db:"id" json:"id"`
	GoogleSub    string    `db:"google_sub" json:"-"`
	Email        string    `db:"email" json:"email"`
	Name         string    `db:"name" json:"name"`
	PictureURL   string    `db:"picture_url" json:"picture_url"`
	Role         string    `db:"role" json:"role"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	LastLoginAt  time.Time `db:"last_login_at" json:"last_login_at"`
}

// PublicView is what we return from /auth/me — hides internal identity bits
// and timestamps that the UI doesn't need.
func (u *User) PublicView() map[string]interface{} {
	return map[string]interface{}{
		"id":          u.ID,
		"email":       u.Email,
		"name":        u.Name,
		"picture_url": u.PictureURL,
		"role":        u.Role,
	}
}