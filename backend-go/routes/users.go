package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend-go/models"
	"backend-go/schemas"
	"backend-go/services"
)

type UserHandler struct {
	Auth         AuthService
	AuthProvider AuthProvider
	Users        UserRepository
	Now          func() time.Time
}

func RegisterUserRoutes(mux *http.ServeMux, auth AuthService, authProvider AuthProvider, users UserRepository) {
	handler := &UserHandler{
		Auth:         auth,
		AuthProvider: authProvider,
		Users:        users,
		Now:          time.Now().UTC,
	}

	mux.HandleFunc("POST /users", handler.CreateUser)
	mux.HandleFunc("GET /users/{user_id}", handler.GetUser)
	mux.HandleFunc("PUT /users/{user_id}", handler.UpdateUser)
	mux.HandleFunc("PATCH /users/{user_id}", handler.UpdateUser)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil || h.AuthProvider == nil || h.Users == nil {
		writeError(w, fmt.Errorf("user dependencies are not configured"))
		return
	}

	var payload schemas.UserCreate
	if err := readJSON(r, &payload); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	user, err := h.AuthProvider.SignUp(payload.Email, payload.Password, map[string]any{
		"full_name":    payload.FullName,
		"company_name": payload.Company.Name,
	})
	if err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: err.Error()})
		return
	}
	if user == nil || user.ID == "" {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Error creating user in Auth"})
		return
	}

	companyJSON, err := json.Marshal(payload.Company)
	if err != nil {
		writeError(w, err)
		return
	}

	timestamp := h.now().Format(time.RFC3339)
	if err := h.Users.InsertUser(map[string]any{
		"id":         user.ID,
		"full_name":  payload.FullName,
		"email":      payload.Email,
		"company":    string(companyJSON),
		"created_at": timestamp,
		"updated_at": timestamp,
	}); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: err.Error()})
		return
	}

	createdUser, err := h.Auth.GetUserOr404(user.ID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, createdUser)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeError(w, fmt.Errorf("auth service is not configured"))
		return
	}

	user, err := h.Auth.GetUserOr404(r.PathValue("user_id"))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil || h.Users == nil {
		writeError(w, fmt.Errorf("user dependencies are not configured"))
		return
	}

	userID := r.PathValue("user_id")
	current, err := h.Auth.GetUserOr404(userID)
	if err != nil {
		writeError(w, err)
		return
	}

	var payload schemas.UserUpdate
	if err := readJSON(r, &payload); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	updateData := map[string]any{}
	if payload.FullName != nil {
		updateData["full_name"] = *payload.FullName
	}
	if payload.Email != nil {
		updateData["email"] = *payload.Email
	}
	if payload.Company != nil {
		companyJSON, err := json.Marshal(payload.Company)
		if err != nil {
			writeError(w, err)
			return
		}
		updateData["company"] = string(companyJSON)
	}

	if len(updateData) == 0 {
		writeJSON(w, http.StatusOK, current)
		return
	}

	updateData["updated_at"] = h.now().Format(time.RFC3339)
	if err := h.Users.UpdateUser(userID, updateData); err != nil {
		writeError(w, err)
		return
	}

	updatedUser, err := h.Auth.GetUserOr404(userID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updatedUser)
}

func userToMap(user models.User) map[string]any {
	return map[string]any{
		"id":         user.ID,
		"full_name":  user.FullName,
		"email":      user.Email,
		"company":    user.Company,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	}
}

func (h *UserHandler) now() time.Time {
	if h != nil && h.Now != nil {
		return h.Now().UTC()
	}
	return time.Now().UTC()
}
