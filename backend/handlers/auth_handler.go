package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"crud-app/auth"
	"crud-app/config"
	"crud-app/database"
	"crud-app/models"
)

// AuthHandler implements the OAuth2 login flow and session endpoints.
type AuthHandler struct {
	cfg  *config.Config
	oa   *oauth2.Config
}

// NewAuthHandler follows the repo convention: takes only the new
// dependencies (config). DB is fetched from the package singleton.
func NewAuthHandler(cfg *config.Config) *AuthHandler {
	oa := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	return &AuthHandler{cfg: cfg, oa: oa}
}

// GoogleLogin generates a CSRF state token, stores it in a short-lived
// cookie, and redirects the user to Google's OAuth consent screen.
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := auth.GenerateToken()
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "could not generate state"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     auth.StateCookieName,
		Value:    state,
		Path:     "/",
		MaxAge:   int(auth.StateTTL.Seconds()),
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})

	// AccessType=online (default) — we don't need refresh tokens.
	u := h.oa.AuthCodeURL(state, oauth2.AccessTypeOnline)
	http.Redirect(w, r, u, http.StatusFound)
}

// GoogleUserinfo is the subset of https://www.googleapis.com/oauth2/v3/userinfo
// we consume. email_verified is the gate that prevents allowlist bypass.
type GoogleUserinfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// GoogleCallback handles Google's redirect after user consent.
// Validates state, exchanges code for token, fetches profile, upserts user,
// opens session, sets cookie, redirects to FRONTEND_URL.
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Always clear the state cookie — success or failure.
	defer func() {
		http.SetCookie(w, &http.Cookie{
			Name:     auth.StateCookieName,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   h.cfg.CookieSecure,
			SameSite: http.SameSiteLaxMode,
		})
	}()

	queryState := r.URL.Query().Get("state")
	cookieState := ""
	if c, err := r.Cookie(auth.StateCookieName); err == nil {
		cookieState = c.Value
	}

	if queryState == "" || cookieState == "" || !auth.ConstantTimeEqual(queryState, cookieState) {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid state"})
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "missing code"})
		return
	}

	tok, err := h.oa.Exchange(r.Context(), code)
	if err != nil {
		jsonResponse(w, http.StatusBadGateway, map[string]string{"error": "google exchange failed: " + err.Error()})
		return
	}

	userInfo, err := fetchGoogleUserinfo(r.Context(), tok.AccessToken)
	if err != nil {
		jsonResponse(w, http.StatusBadGateway, map[string]string{"error": "google userinfo failed: " + err.Error()})
		return
	}

	// Reject unverified emails — allowlist by email is meaningless otherwise.
	if !userInfo.EmailVerified {
		jsonResponse(w, http.StatusForbidden, map[string]string{"error": "email no verificado por Google"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(userInfo.Email))
	if !h.cfg.IsEmailAllowed(email) {
		jsonResponse(w, http.StatusForbidden, map[string]string{"error": "email no autorizado"})
		return
	}

	if err := upsertUser(r.Context(), userInfo, h.cfg); err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "upsert user: " + err.Error()})
		return
	}

	user, err := findUserByGoogleSub(r.Context(), userInfo.Sub)
	if err != nil || user == nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "user lookup failed"})
		return
	}

	auth.PurgeExpired()
	token, expiresAt, err := auth.CreateSession(user.ID, h.cfg.SessionTTL)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "session create failed"})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   int(h.cfg.SessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, h.cfg.FrontendURL, http.StatusFound)
}

// Logout revokes the current session and clears the cookie. POST preferred
// (with SameSite=Lax + cross-origin dev setups GETs may not carry cookie).
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(auth.CookieName); err == nil {
		_ = auth.DeleteSession(c.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	jsonResponse(w, http.StatusOK, map[string]string{"message": "logout ok"})
}

// Me returns the current user. Public endpoint — returns 401 if no session.
// Goes through RequireAuth middleware? No — auth/me is special because it
// must NOT redirect the user back to itself, and it must distinguish
// "no cookie" (401) from "expired cookie" (also 401, same shape).
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(auth.CookieName)
	if err != nil || c.Value == "" {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "no autenticado"})
		return
	}
	user, err := auth.LookupSession(c.Value)
	if err != nil {
		jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "lookup failed"})
		return
	}
	if user == nil {
		jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "sesión inválida o expirada"})
		return
	}
	jsonResponse(w, http.StatusOK, user.PublicView())
}

// fetchGoogleUserinfo calls Google's userinfo endpoint with the access token
// and decodes the response. Uses the standard library instead of pulling in
// google.golang.org/api.
func fetchGoogleUserinfo(ctx context.Context, accessToken string) (*GoogleUserinfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo status %d: %s", resp.StatusCode, string(body))
	}

	var ui GoogleUserinfo
	if err := json.NewDecoder(resp.Body).Decode(&ui); err != nil {
		return nil, err
	}
	return &ui, nil
}

// upsertUser creates the user on first login (role determined by
// ADMIN_EMAILS), or refreshes name/picture/last_login_at on subsequent
// logins WITHOUT touching role. Admin promotion/demotion is done by
// editing the DB directly.
//
// Edge case: if the email already exists with a different google_sub
// (test data, account merge, re-issued Google account), we update the
// existing row's google_sub instead of failing the login.
func upsertUser(ctx context.Context, ui *GoogleUserinfo, cfg *config.Config) error {
	db := database.GetDB()
	email := strings.ToLower(strings.TrimSpace(ui.Email))

	// 1) Try update by google_sub (the normal case for returning users).
	res, err := db.ExecContext(ctx, `
		UPDATE users SET name = ?, picture_url = ?, last_login_at = CURRENT_TIMESTAMP
		WHERE google_sub = ?`,
		ui.Name, ui.Picture, ui.Sub)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n > 0 {
		return nil
	}

	// 2) Email already exists with a DIFFERENT google_sub → take over that
	// row. This handles test-data leftovers, account re-creation, etc.
	// Note: we intentionally do NOT change `role` here — keep whatever the
	// DB has, even if email is in ADMIN_EMAILS (you don't auto-promote by
	// re-linking an existing email).
	res, err = db.ExecContext(ctx, `
		UPDATE users SET google_sub = ?, name = ?, picture_url = ?, last_login_at = CURRENT_TIMESTAMP
		WHERE email = ?`,
		ui.Sub, ui.Name, ui.Picture, email)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n > 0 {
		return nil
	}

	// 3) First login — INSERT new row with role determined by ADMIN_EMAILS.
	role := models.RoleUser
	if cfg.IsAdminEmail(email) {
		role = models.RoleAdmin
	}
	_, err = db.ExecContext(ctx, `
		INSERT INTO users (google_sub, email, name, picture_url, role)
		VALUES (?, ?, ?, ?, ?)`,
		ui.Sub, email, ui.Name, ui.Picture, role)
	return err
}

func findUserByGoogleSub(ctx context.Context, sub string) (*models.User, error) {
	var u models.User
	err := database.GetDB().QueryRowContext(ctx, `
		SELECT id, google_sub, email, name, picture_url, role, created_at, last_login_at
		FROM users WHERE google_sub = ?`, sub).Scan(
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