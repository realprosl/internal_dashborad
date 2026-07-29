// Package config loads runtime configuration from environment variables.
// It uses godotenv to read .env files in development; environment variables
// always take precedence.
package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all runtime settings for the backend.
type Config struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string

	// Allowlist of emails that may sign in. Empty = nobody allowed.
	AllowedEmails map[string]bool

	// Subset of AllowedEmails that get role='admin' on first login.
	AdminEmails map[string]bool

	SessionTTL time.Duration
	CookieSecure bool
}

// Load reads .env (if present), then reads environment variables and returns
// a fully populated Config. Fails loudly (log.Fatal) if required values are
// missing — there is no sensible default for OAuth credentials.
func Load() *Config {
	// .env is optional; missing file is not an error.
	_ = godotenv.Load()

	cfg := &Config{
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		FrontendURL:        os.Getenv("FRONTEND_URL"),
		AllowedEmails:      parseCSVSet(os.Getenv("ALLOWED_EMAILS")),
		AdminEmails:        parseCSVSet(os.Getenv("ADMIN_EMAILS")),
		CookieSecure:       parseBoolDefault(os.Getenv("COOKIE_SECURE"), true),
		SessionTTL:         time.Duration(parseIntDefault(os.Getenv("SESSION_TTL_HOURS"), 24)) * time.Hour,
	}

	if cfg.FrontendURL == "" {
		cfg.FrontendURL = "/"
	}

	if cfg.GoogleClientID == "" || cfg.GoogleClientSecret == "" || cfg.GoogleRedirectURL == "" {
		log.Fatal("OAuth misconfigured: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URL son obligatorios (ver backend/.env.example)")
	}

	if len(cfg.AllowedEmails) == 0 {
		log.Fatal("ALLOWED_EMAILS está vacío: nadie podría autenticarse (ver backend/.env.example)")
	}

	log.Printf("OAuth: client_id=%s... redirect=%s | allowed=%d emails | admins=%d | session_ttl=%s | cookie_secure=%v",
		truncate(cfg.GoogleClientID, 12),
		cfg.GoogleRedirectURL,
		len(cfg.AllowedEmails),
		len(cfg.AdminEmails),
		cfg.SessionTTL,
		cfg.CookieSecure,
	)

	return cfg
}

// IsEmailAllowed reports whether the given email may sign in.
// Comparison is case-insensitive on both sides; input is trimmed.
func (c *Config) IsEmailAllowed(email string) bool {
	return c.AllowedEmails[strings.ToLower(strings.TrimSpace(email))]
}

// IsAdminEmail reports whether the given email should be granted admin role
// on first sign-in. Same normalization as IsEmailAllowed.
func (c *Config) IsAdminEmail(email string) bool {
	return c.AdminEmails[strings.ToLower(strings.TrimSpace(email))]
}

func parseCSVSet(s string) map[string]bool {
	out := map[string]bool{}
	for _, raw := range strings.Split(s, ",") {
		e := strings.ToLower(strings.TrimSpace(raw))
		if e != "" {
			out[e] = true
		}
	}
	return out
}

func parseBoolDefault(s string, def bool) bool {
	if s == "" {
		return def
	}
	b, err := strconv.ParseBool(s)
	if err != nil {
		return def
	}
	return b
}

func parseIntDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}