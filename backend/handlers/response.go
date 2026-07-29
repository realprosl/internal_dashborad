package handlers

import (
	"encoding/json"
	"net/http"
)

// jsonResponse writes data as JSON with the given status code. Extracted
// here so handlers don't each duplicate their own copy.
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// Headers already sent — best we can do is log and let the
		// connection close.
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}