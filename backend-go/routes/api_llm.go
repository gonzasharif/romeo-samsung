package routes

import (
	"fmt"
	"net/http"

	"backend-go/schemas"
	"backend-go/services"
)

type APILLMHandler struct {
	Service APILLMService
}

func RegisterAPILLMRoutes(mux *http.ServeMux, service APILLMService) {
	handler := &APILLMHandler{Service: service}
	mux.HandleFunc("GET /api-llm/models", handler.GetModels)
	mux.HandleFunc("POST /api-llm/start", handler.StartModel)
	mux.HandleFunc("POST /api-llm/{model_id}/ask", handler.AskModel)
	mux.HandleFunc("POST /api-llm/{model_id}/stop", handler.StopModel)
	mux.HandleFunc("POST /api-llm/{project_id}/create_people_model", handler.CreatePeopleModel)
}

func (h *APILLMHandler) GetModels(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		writeError(w, fmt.Errorf("api llm service is not configured"))
		return
	}

	data, err := h.Service.GetModels()
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *APILLMHandler) StartModel(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		writeError(w, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.StartModelRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.StartModel(map[string]any{
		"model_name":    req.ModelName,
		"agent_context": req.AgentContext,
		"n_gpu_layers":  req.NGPULayers,
		"n_ctx":         req.NCtx,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *APILLMHandler) AskModel(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		writeError(w, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.AskModelRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.AskModel(map[string]any{
		"model_id": r.PathValue("model_id"),
		"prompt":   req.Prompt,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *APILLMHandler) StopModel(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		writeError(w, fmt.Errorf("api llm service is not configured"))
		return
	}

	data, err := h.Service.StopModel(r.PathValue("model_id"))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *APILLMHandler) CreatePeopleModel(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		writeError(w, fmt.Errorf("api llm service is not configured"))
		return
	}

	var req schemas.CreatePeopleModelRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, &services.HTTPError{StatusCode: http.StatusBadRequest, Detail: "Invalid request body"})
		return
	}

	data, err := h.Service.CreatePeopleModel(map[string]any{
		"project_id": r.PathValue("project_id"),
		"prompt":     req.Prompt,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, data)
}
