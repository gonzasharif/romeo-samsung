package routes

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"backend-go/services"
)

func readJSON(r *http.Request, dst any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(dst)
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

func writeError(w http.ResponseWriter, err error) {
	var httpErr *services.HTTPError
	if errors.As(err, &httpErr) {
		writeJSON(w, httpErr.StatusCode, map[string]string{"detail": httpErr.Detail})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{"detail": err.Error()})
}

func bearerToken(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if header == "" {
		return ""
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}
