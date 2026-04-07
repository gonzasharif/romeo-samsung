package routes

import (
	"fmt"
	"net/http"

	"backend-go/schemas"
	"backend-go/services"
)

type AuthHandler struct {
	Provider AuthProvider
}

func RegisterAuthRoutes(mux *http.ServeMux, provider AuthProvider) {
	handler := &AuthHandler{Provider: provider}
	mux.HandleFunc("POST /login", handler.Login)
	mux.HandleFunc("POST /logout", handler.Logout)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if h.Provider == nil {
		writeError(w, fmt.Errorf("auth provider is not configured"))
		return
	}

	var payload schemas.LoginRequest
	if err := readJSON(r, &payload); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	response, err := h.Provider.SignInWithPassword(payload.Email, payload.Password)
	if err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusUnauthorized, Detail: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if h.Provider != nil {
		_ = h.Provider.SignOut(bearerToken(r))
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}
