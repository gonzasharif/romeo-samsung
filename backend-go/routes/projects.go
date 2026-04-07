package routes

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"backend-go/models"
	"backend-go/schemas"
	"backend-go/services"
	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	Auth         AuthService
	Projects     ProjectRepository
	TargetModels TargetModelRepository
	Simulations  SimulationRepository
	LLM          APILLMService
	Now          func() time.Time
	NewID        func() string
}

func RegisterProjectRoutes(
	router gin.IRouter,
	auth AuthService,
	projects ProjectRepository,
	targetModels TargetModelRepository,
	simulations SimulationRepository,
	llm APILLMService,
) {
	handler := &ProjectHandler{
		Auth:         auth,
		Projects:     projects,
		TargetModels: targetModels,
		Simulations:  simulations,
		LLM:          llm,
		Now:          time.Now().UTC,
		NewID:        newRouteID,
	}

	router.GET("/projects", handler.ListProjects)
	router.POST("/projects", handler.CreateProject)
	router.GET("/projects/:project_id", handler.GetProject)
	router.PUT("/projects/:project_id", handler.UpdateProject)
	router.DELETE("/projects/:project_id", handler.DeleteProject)
	router.GET("/projects/:project_id/models", handler.ListProjectModels)
	router.POST("/projects/:project_id/generate_agents", handler.GenerateProjectAgents)
	router.DELETE("/projects/:project_id/models/:model_id", handler.DeleteProjectModel)
	router.GET("/projects/:project_id/simulations", handler.ListSimulations)
	router.POST("/projects/:project_id/simulations", handler.CreateSimulation)
}

func (h *ProjectHandler) ListProjects(c *gin.Context) {
	user, ok := h.authenticatedUser(c)
	if !ok {
		return
	}
	if h.Projects == nil {
		writeError(c, fmt.Errorf("project repository is not configured"))
		return
	}

	rows, err := h.Projects.ListProjectsByOwner(user.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	projects := make([]models.Project, 0, len(rows))
	for _, row := range rows {
		project, err := decodeProject(row)
		if err != nil {
			writeError(c, err)
			return
		}
		projects = append(projects, project)
	}

	writeJSON(c, 200, projects)
}

func (h *ProjectHandler) CreateProject(c *gin.Context) {
	user, ok := h.authenticatedUser(c)
	if !ok {
		return
	}
	if h.Projects == nil {
		writeError(c, fmt.Errorf("project repository is not configured"))
		return
	}

	var payload schemas.ProjectCreate
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	timestamp := h.now().Format(time.RFC3339)
	row, err := h.Projects.InsertProject(map[string]any{
		"owner_id":   user.ID,
		"name":       payload.Name,
		"context":    payload.Context,
		"stats":      map[string]any{},
		"created_at": timestamp,
		"updated_at": timestamp,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	project, err := decodeProject(row)
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 201, project)
}

func (h *ProjectHandler) GetProject(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}

	writeJSON(c, 200, project)
}

func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.Projects == nil {
		writeError(c, fmt.Errorf("project repository is not configured"))
		return
	}

	var payload schemas.ProjectUpdate
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	updateData := map[string]any{"updated_at": h.now().Format(time.RFC3339)}
	if payload.Name != nil {
		updateData["name"] = *payload.Name
	}
	if payload.Context != nil {
		updateData["context"] = payload.Context
	}

	if err := h.Projects.UpdateProject(project.ID, updateData); err != nil {
		writeError(c, err)
		return
	}

	updatedProject, err := h.Auth.GetProjectOr404(project.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, updatedProject)
}

func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.Projects == nil {
		writeError(c, fmt.Errorf("project repository is not configured"))
		return
	}

	if err := h.Projects.DeleteProject(project.ID); err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 204, nil)
}

func (h *ProjectHandler) ListProjectModels(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}

	modelsList, err := h.listProjectModels(project.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 200, modelsList)
}

func (h *ProjectHandler) GenerateProjectAgents(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.LLM == nil {
		writeError(c, fmt.Errorf("api llm service is not configured"))
		return
	}

	ctx := project.Context
	prompt := fmt.Sprintf(
		"Product: %s. Audience: %s. Gender: %s. Price: %s.",
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.Description }, "No description"),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.TargetAge }, "Any"),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.TargetGender }, "Any"),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.SuggestedPrice }, "Any"),
	)

	data, err := h.LLM.CreatePeopleModel(map[string]any{
		"prompt":     prompt,
		"project_id": project.ID,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	savedModels := []models.TargetModel{}
	if raw, ok := data["saved_models"].([]any); ok {
		for _, item := range raw {
			row, ok := item.(map[string]any)
			if !ok {
				continue
			}
			model, err := decodeTargetModel(row)
			if err != nil {
				writeError(c, err)
				return
			}
			savedModels = append(savedModels, model)
		}
	}

	writeJSON(c, 201, savedModels)
}

func (h *ProjectHandler) DeleteProjectModel(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.TargetModels == nil || h.Projects == nil {
		writeError(c, fmt.Errorf("project dependencies are not configured"))
		return
	}

	if err := h.TargetModels.DeleteTargetModel(project.ID, c.Param("model_id")); err != nil {
		writeError(c, err)
		return
	}
	if err := h.Projects.UpdateProject(project.ID, map[string]any{"updated_at": h.now().Format(time.RFC3339)}); err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 204, nil)
}

func (h *ProjectHandler) ListSimulations(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.Simulations == nil {
		writeError(c, fmt.Errorf("simulation repository is not configured"))
		return
	}

	rows, err := h.Simulations.ListSimulationRunsByProject(project.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	simulations := make([]models.SimulationRun, 0, len(rows))
	for _, row := range rows {
		run, err := decodeSimulationRun(normalizeSimulationRow(row))
		if err != nil {
			writeError(c, err)
			return
		}
		simulations = append(simulations, run)
	}

	writeJSON(c, 200, simulations)
}

func (h *ProjectHandler) CreateSimulation(c *gin.Context) {
	project, ok := h.ownedProject(c)
	if !ok {
		return
	}
	if h.Simulations == nil || h.Projects == nil || h.LLM == nil {
		writeError(c, fmt.Errorf("simulation dependencies are not configured"))
		return
	}

	var payload schemas.SimulationCreate
	if err := c.ShouldBindJSON(&payload); err != nil {
		writeError(c, &services.HTTPError{StatusCode: 400, Detail: "Invalid request body"})
		return
	}

	agents, err := h.listProjectModels(project.ID)
	if err != nil {
		writeError(c, err)
		return
	}

	timestamp := h.now()
	runID := h.newID()
	runData := map[string]any{
		"id":              runID,
		"project_id":      project.ID,
		"scenario_name":   payload.ScenarioName,
		"provider":        providerOrDefault(payload.Provider),
		"status":          2,
		"questions":       payload.Questions,
		"overrides":       map[string]any{},
		"agents_snapshot": agents,
		"started_at":      timestamp.Format(time.RFC3339),
		"completed_at":    timestamp.Format(time.RFC3339),
		"summary":         []any{},
	}

	if err := h.Simulations.InsertSimulationRun(runData); err != nil {
		writeError(c, err)
		return
	}

	ctx := project.Context
	agentContext := fmt.Sprintf(
		"Description: %s. Audience: %s. Gender: %s. Price: %s.",
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.Description }, ""),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.TargetAge }, ""),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.TargetGender }, ""),
		projectContextValue(ctx, func(c *models.ProjectContext) *string { return c.SuggestedPrice }, ""),
	)

	modelData, err := h.LLM.StartModel(map[string]any{
		"model_name":    "gemma-3-4b-it-Q4_K_M.gguf",
		"agent_context": agentContext,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	modelID, _ := modelData["model_id"].(string)
	if modelID != "" {
		defer func() { _, _ = h.LLM.StopModel(modelID) }()
	}

	agentResponses := make([]map[string]any, 0, len(agents))
	for _, agent := range agents {
		promptJSON, err := json.Marshal(agent)
		if err != nil {
			writeError(c, err)
			return
		}

		answerData, err := h.LLM.AskModel(map[string]any{
			"model_id": modelID,
			"prompt":   string(promptJSON),
		})
		if err != nil {
			writeError(c, err)
			return
		}

		response := any(map[string]any{"error": "Sin respuesta"})
		if value, ok := answerData["response"]; ok {
			response = value
		}

		agentResponses = append(agentResponses, map[string]any{
			"User":     agent.Name,
			"Feedback": response,
		})
	}

	if err := h.Simulations.UpdateSimulationRun(runID, map[string]any{
		"summary":      agentResponses,
		"completed_at": h.now().Format(time.RFC3339),
	}); err != nil {
		writeError(c, err)
		return
	}
	if err := h.Projects.UpdateProject(project.ID, map[string]any{"updated_at": timestamp.Format(time.RFC3339)}); err != nil {
		writeError(c, err)
		return
	}

	runData["summary"] = agentResponses
	run, err := decodeSimulationRun(normalizeSimulationRow(runData))
	if err != nil {
		writeError(c, err)
		return
	}

	writeJSON(c, 202, run)
}

func (h *ProjectHandler) authenticatedUser(c *gin.Context) (models.User, bool) {
	if h.Auth == nil {
		writeError(c, fmt.Errorf("auth service is not configured"))
		return models.User{}, false
	}

	user, err := h.Auth.GetAuthenticatedUser(bearerToken(c))
	if err != nil {
		writeError(c, err)
		return models.User{}, false
	}

	return user, true
}

func (h *ProjectHandler) ownedProject(c *gin.Context) (models.Project, bool) {
	user, ok := h.authenticatedUser(c)
	if !ok {
		return models.Project{}, false
	}

	project, err := h.Auth.GetProjectOr404(c.Param("project_id"))
	if err != nil {
		writeError(c, err)
		return models.Project{}, false
	}
	if err := services.AssertProjectOwner(project, user); err != nil {
		writeError(c, err)
		return models.Project{}, false
	}

	return project, true
}

func (h *ProjectHandler) listProjectModels(projectID string) ([]models.TargetModel, error) {
	if h.TargetModels == nil {
		return nil, fmt.Errorf("target model repository is not configured")
	}

	rows, err := h.TargetModels.ListTargetModelsByProject(projectID)
	if err != nil {
		return nil, err
	}

	modelsList := make([]models.TargetModel, 0, len(rows))
	for _, row := range rows {
		model, err := decodeTargetModel(row)
		if err != nil {
			return nil, err
		}
		modelsList = append(modelsList, model)
	}

	return modelsList, nil
}

func (h *ProjectHandler) now() time.Time {
	if h != nil && h.Now != nil {
		return h.Now().UTC()
	}
	return time.Now().UTC()
}

func (h *ProjectHandler) newID() string {
	if h != nil && h.NewID != nil {
		return h.NewID()
	}
	return newRouteID()
}

func decodeProject(row map[string]any) (models.Project, error) {
	var project models.Project
	if err := decodeMap(row, &project); err != nil {
		return models.Project{}, err
	}
	return project, nil
}

func decodeTargetModel(row map[string]any) (models.TargetModel, error) {
	var model models.TargetModel
	if err := decodeMap(row, &model); err != nil {
		return models.TargetModel{}, err
	}
	return model, nil
}

func decodeSimulationRun(row map[string]any) (models.SimulationRun, error) {
	var run models.SimulationRun
	if err := decodeMap(row, &run); err != nil {
		return models.SimulationRun{}, err
	}
	return run, nil
}

func decodeMap(row map[string]any, dst any) error {
	payload, err := json.Marshal(row)
	if err != nil {
		return err
	}
	return json.Unmarshal(payload, dst)
}

func normalizeSimulationRow(row map[string]any) map[string]any {
	normalized := map[string]any{}
	for key, value := range row {
		normalized[key] = value
	}

	if normalized["questions"] == nil {
		normalized["questions"] = []string{}
	}

	if agentsSnapshot, ok := normalized["agents_snapshot"].(string); ok {
		var parsed []map[string]any
		if err := json.Unmarshal([]byte(agentsSnapshot), &parsed); err == nil {
			normalized["agents_snapshot"] = parsed
		} else {
			normalized["agents_snapshot"] = []map[string]any{}
		}
	}
	if normalized["agents_snapshot"] == nil {
		normalized["agents_snapshot"] = []map[string]any{}
	}

	if normalized["summary"] == nil {
		normalized["summary"] = []any{}
	}

	return normalized
}

func projectContextValue(ctx *models.ProjectContext, getter func(*models.ProjectContext) *string, fallback string) string {
	if ctx == nil {
		return fallback
	}
	value := getter(ctx)
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}

func providerOrDefault(provider schemas.Provider) string {
	if provider == "" {
		return string(schemas.ProviderMock)
	}
	return string(provider)
}

func newRouteID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UTC().UnixNano())
	}
	return hex.EncodeToString(bytes)
}
