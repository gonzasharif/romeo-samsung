package routes

import (
	"fmt"

	"backend-go/schemas"
	"backend-go/services"
	"github.com/gin-gonic/gin"
)

type APILLMHandler struct {
	Service APILLMService
}

func RegisterAPILLMRoutes(router gin.IRouter, service APILLMService) {
	handler := &APILLMHandler{Service: service}
	group := router.Group("/api-llm")
	group.GET("/models", handler.GetModels)
	group.POST("/start", handler.StartModel)
	group.POST("/:model_id/ask", handler.AskModel)
	group.POST("/:model_id/stop", handler.StopModel)
	group.POST("/:project_id/create_people_model", handler.CreatePeopleModel)
}

func (h *APILLMHandler) GetModels(c *gin.Context) {
	if h.Service == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	data, err := h.Service.GetModels()
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, data)
}

func (h *APILLMHandler) StartModel(c *gin.Context) {
	if h.Service == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.StartModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.StartModel(map[string]any{
		"model_name":    req.ModelName,
		"agent_context": req.AgentContext,
		"n_gpu_layers":  req.NGPULayers,
		"n_ctx":         req.NCtx,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, data)
}

func (h *APILLMHandler) AskModel(c *gin.Context) {
	if h.Service == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.AskModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.AskModel(map[string]any{
		"model_id": c.Param("model_id"),
		"prompt":   req.Prompt,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, data)
}

func (h *APILLMHandler) StopModel(c *gin.Context) {
	if h.Service == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	data, err := h.Service.StopModel(c.Param("model_id"))
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, data)
}

func (h *APILLMHandler) CreatePeopleModel(c *gin.Context) {
	if h.Service == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.CreatePeopleModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.CreatePeopleModel(map[string]any{
		"project_id": c.Param("project_id"),
		"prompt":     req.Prompt,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, data)
}
