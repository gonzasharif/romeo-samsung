package routes

import (
	"encoding/json"
	"fmt"
	"time"

	"backend-go/schemas"
	"backend-go/services"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Auth         AuthService
	AuthProvider AuthProvider
	Users        UserRepository
	Now          func() time.Time
}

func RegisterUserRoutes(router gin.IRouter, auth AuthService, authProvider AuthProvider, users UserRepository) {
	handler := &UserHandler{
		Auth:         auth,
		AuthProvider: authProvider,
		Users:        users,
		Now:          time.Now().UTC,
	}

	router.POST("/users", handler.CreateUser)
	router.GET("/users/:user_id", handler.GetUser)
	router.PUT("/users/:user_id", handler.UpdateUser)
	router.PATCH("/users/:user_id", handler.UpdateUser)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	if h.Auth == nil || h.AuthProvider == nil || h.Users == nil {
		writeError(c, fmt.Errorf("user dependencies are not configured"))
		return
	}

	var payload schemas.UserCreate
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	user, err := h.AuthProvider.SignUp(payload.Email, payload.Password, map[string]any{
		"full_name":    payload.FullName,
		"company_name": payload.Company.Name,
	})
	if err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: err.Error()})
		return
	}
	if user == nil || user.ID == "" {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Error creating user in Auth"})
		return
	}

	companyJSON, err := json.Marshal(payload.Company)
	if err != nil {
		writeError(c, err)
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
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: err.Error()})
		return
	}

	createdUser, err := h.Auth.GetUserOr404(user.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 201, createdUser)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	if h.Auth == nil {
		writeError(c, fmt.Errorf("auth service is not configured"))
		return
	}

	user, err := h.Auth.GetUserOr404(c.Param("user_id"))
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	if h.Auth == nil || h.Users == nil {
		writeError(c, fmt.Errorf("user dependencies are not configured"))
		return
	}

	userID := c.Param("user_id")
	current, err := h.Auth.GetUserOr404(userID)
	if err != nil {
		writeError(c, err)
		return
	}

	var payload schemas.UserUpdate
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
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
			writeError(c, err)
			return
		}
		updateData["company"] = string(companyJSON)
	}

	if len(updateData) == 0 {
		writeJSON(c, 200, current)
		return
	}

	updateData["updated_at"] = h.now().Format(time.RFC3339)
	if err := h.Users.UpdateUser(userID, updateData); err != nil {
		writeError(c, err)
		return
	}

	updatedUser, err := h.Auth.GetUserOr404(userID)
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, updatedUser)
}

func (h *UserHandler) now() time.Time {
	if h != nil && h.Now != nil {
		return h.Now().UTC()
	}
	return time.Now().UTC()
}
