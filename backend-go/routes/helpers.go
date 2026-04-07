package routes

import (
	"errors"
	"strings"

	"backend-go/services"
	"github.com/gin-gonic/gin"
)

func writeJSON(c *gin.Context, statusCode int, payload any) {
	if payload == nil {
		c.Status(statusCode)
		return
	}
	c.JSON(statusCode, payload)
}

func writeError(c *gin.Context, err error) {
	var httpErr *services.HTTPError
	if errors.As(err, &httpErr) {
		c.JSON(httpErr.StatusCode, gin.H{"detail": httpErr.Detail})
		return
	}

	c.JSON(500, gin.H{"detail": err.Error()})
}

func bearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if header == "" {
		return ""
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}
