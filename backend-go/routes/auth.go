package routes

import (
	"fmt"

	"backend-go/schemas"
	"backend-go/services"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Provider AuthProvider
}

func RegisterAuthRoutes(router gin.IRouter, provider AuthProvider) {
	handler := &AuthHandler{Provider: provider}
	router.POST("/login", handler.Login)
	router.POST("/logout", handler.Logout)
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.Provider == nil {
		writeError(c, fmt.Errorf("auth provider is not configured"))
		return
	}

	var payload schemas.LoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	response, err := h.Provider.SignInWithPassword(payload.Email, payload.Password)
	if err != nil {
		writeError(c, &services.HTTPError{StatusCode: 401, Detail: err.Error()})
		return
	}

	writeJSON(c, 200, response)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	if h.Provider != nil {
		_ = h.Provider.SignOut(bearerToken(c))
	}

	writeJSON(c, 200, gin.H{"message": "Logged out successfully"})
}
