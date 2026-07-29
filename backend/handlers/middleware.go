package handlers

import (
	"context"
	"net/http"

	"crud-app/auth"
	"crud-app/models"
)

// ctxKey is unexported so external packages cannot collide with our
// context keys. Idiomatic Go for context values.
type ctxKey struct{ name string }

var userCtxKey = ctxKey{"user"}

// UserFromContext returns the authenticated user attached by RequireAuth.
// Returns nil if the request is anonymous (or the middleware wasn't run).
func UserFromContext(ctx context.Context) *models.User {
	u, _ := ctx.Value(userCtxKey).(*models.User)
	return u
}

// RequireAuth rejects requests without a valid session cookie (401).
// On success it attaches the user to the request context.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(auth.CookieName)
		if err != nil || c.Value == "" {
			jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "no autenticado"})
			return
		}
		user, err := auth.LookupSession(c.Value)
		if err != nil {
			jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "session lookup failed"})
			return
		}
		if user == nil {
			jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "sesión inválida o expirada"})
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAdminForWrites allows GET/HEAD/OPTIONS for any authenticated user
// but rejects POST/PUT/DELETE/PATCH with 403 if the user is not an admin.
// Designed to wrap the entire /api/* sub-mux.
func RequireAdminForWrites(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m := r.Method
		if m == http.MethodGet || m == http.MethodHead || m == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		u := UserFromContext(r.Context())
		if u == nil || u.Role != models.RoleAdmin {
			jsonResponse(w, http.StatusForbidden, map[string]string{"error": "se requiere rol admin"})
			return
		}
		next.ServeHTTP(w, r)
	})
}