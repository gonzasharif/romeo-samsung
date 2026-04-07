package routes

import "github.com/gin-gonic/gin"

func RegisterHealthRoutes(router gin.IRouter) {
	router.GET("/health", func(c *gin.Context) {
		writeJSON(c, 200, gin.H{"status": "ok"})
	})
}
