package services

import (
	"fmt"
	"time"

	"backend-go/models"
	"backend-go/utils"
)

const defaultLLMAPIURL = "http://api:8080"

type LLMClient interface {
	GetModels(baseURL string) (map[string]any, int, error)
	StartModel(baseURL string, requestData map[string]any) (map[string]any, int, error)
	AskModel(baseURL, modelID, prompt string) (map[string]any, int, error)
	StopModel(baseURL, modelID string) (map[string]any, int, error)
	CreatePeopleModel(baseURL string, payload map[string]any) (map[string]any, int, error)
}

type SimulationRunStore interface {
	InsertSimulationRun(data map[string]any) (map[string]any, error)
}

type TargetModelStore interface {
	InsertTargetModel(data map[string]any) (map[string]any, error)
}

type APILLMService struct {
	Client         LLMClient
	SimulationRuns SimulationRunStore
	TargetModels   TargetModelStore
	BaseURL        string
	Now            func() time.Time
	NewID          func() string
}

func NewAPILLMService(client LLMClient, simulationRuns SimulationRunStore, targetModels TargetModelStore) *APILLMService {
	return &APILLMService{
		Client:         client,
		SimulationRuns: simulationRuns,
		TargetModels:   targetModels,
		BaseURL:        defaultLLMAPIURL,
		Now:            time.Now().UTC,
		NewID:          utils.NewUUID,
	}
}

func (s *APILLMService) GetModels() (map[string]any, error) {
	if s.Client == nil {
		return nil, fmt.Errorf("llm client is not configured")
	}

	data, statusCode, err := s.Client.GetModels(s.baseURL())
	if err != nil {
		return nil, s.mapLLMError(statusCode, fmt.Sprintf("Error conectando a api_llm: %v, %s", err, s.baseURL()))
	}

	return data, nil
}

func (s *APILLMService) StartModel(requestData map[string]any) (map[string]any, error) {
	if s.Client == nil {
		return nil, fmt.Errorf("llm client is not configured")
	}

	data, statusCode, err := s.Client.StartModel(s.baseURL(), requestData)
	if err != nil {
		return nil, s.mapLLMError(statusCode, fmt.Sprintf("Error conectando a api_llm: %v", err))
	}

	return data, nil
}

func (s *APILLMService) AskModel(requestData map[string]any) (map[string]any, error) {
	if s.Client == nil {
		return nil, fmt.Errorf("llm client is not configured")
	}

	modelID := utils.StringValue(requestData["model_id"])
	prompt := utils.StringValue(requestData["prompt"])
	projectID := utils.StringValue(requestData["project_id"])

	data, statusCode, err := s.Client.AskModel(s.baseURL(), modelID, prompt)
	if err != nil {
		return nil, s.mapLLMError(statusCode, fmt.Sprintf("Error conectando a api_llm: %v", err))
	}

	if projectID == "" {
		return data, nil
	}
	if s.SimulationRuns == nil {
		return data, fmt.Errorf("simulation run store is not configured")
	}

	simRun := s.translateLLMToSimulationRun(
		data,
		projectID,
		utils.StringWithDefault(requestData["scenario_name"], "Auto-generated Scenario"),
		utils.StringWithDefault(requestData["provider"], "mock"),
		utils.StringSliceValue(requestData["questions"], prompt),
		utils.MapValue(requestData["overrides"]),
		utils.TargetModelSliceValue(requestData["agents_snapshot"]),
		utils.StringValue(requestData["simulation_id"]),
	)

	savedRun, err := s.SimulationRuns.InsertSimulationRun(simulationRunToMap(simRun))
	if err != nil {
		return nil, err
	}
	if len(savedRun) > 0 {
		data["saved_run"] = savedRun
	}

	return data, nil
}

func (s *APILLMService) StopModel(modelID string) (map[string]any, error) {
	if s.Client == nil {
		return nil, fmt.Errorf("llm client is not configured")
	}

	data, statusCode, err := s.Client.StopModel(s.baseURL(), modelID)
	if err != nil {
		return nil, s.mapLLMError(statusCode, fmt.Sprintf("Error conectando a api_llm: %v", err))
	}

	return data, nil
}

func (s *APILLMService) CreatePeopleModel(requestData map[string]any) (map[string]any, error) {
	if s.Client == nil {
		return nil, fmt.Errorf("llm client is not configured")
	}

	projectID := utils.StringValue(requestData["project_id"])
	llmPayload := map[string]any{"prompt": utils.StringValue(requestData["prompt"])}

	data, statusCode, err := s.Client.CreatePeopleModel(s.baseURL(), llmPayload)
	if err != nil {
		return nil, s.mapLLMError(statusCode, fmt.Sprintf("Error conectando a api_llm: %v", err))
	}

	if projectID == "" {
		return data, nil
	}
	if s.TargetModels == nil {
		return data, fmt.Errorf("target model store is not configured")
	}

	responseItems, ok := data["response"].([]any)
	if !ok {
		return data, nil
	}

	savedModels := make([]map[string]any, 0, len(responseItems))
	for _, item := range responseItems {
		profile, ok := item.(map[string]any)
		if !ok {
			continue
		}

		targetModel := s.translateLLMToTargetModel(profile, projectID, "")
		savedModel, err := s.TargetModels.InsertTargetModel(targetModelToMap(targetModel))
		if err != nil {
			return nil, err
		}
		if len(savedModel) > 0 {
			savedModels = append(savedModels, savedModel)
		}
	}

	data["saved_models"] = savedModels
	return data, nil
}

func (s *APILLMService) translateLLMToTargetModel(llmData map[string]any, projectID, targetID string) models.TargetModel {
	id := targetID
	if id == "" {
		id = s.newID()
	}

	var age *int
	if ageValue, ok := utils.IntValue(llmData["age"]); ok {
		age = &ageValue
	}

	personality := []string{}
	if rawPersonality, ok := llmData["personality"].([]any); ok {
		personality = utils.AnySliceToStrings(rawPersonality)
	} else if typedPersonality, ok := llmData["personality"].([]string); ok {
		personality = typedPersonality
	}

	occupation := utils.OptionalString(utils.StringValue(llmData["occupation"]))
	level := utils.OptionalString(utils.StringValue(llmData["socioeconomic_level"]))

	return models.TargetModel{
		ID:                 id,
		ProjectID:          projectID,
		Name:               utils.StringWithDefault(llmData["name"], "Unknown Person"),
		Age:                age,
		Occupation:         occupation,
		SocioeconomicLevel: level,
		Personality:        personality,
	}
}

func (s *APILLMService) translateLLMToSimulationRun(
	llmData any,
	projectID, scenarioName, provider string,
	questions []string,
	overrides map[string]any,
	agentsSnapshot []models.TargetModel,
	simulationID string,
) models.SimulationRun {
	id := simulationID
	if id == "" {
		id = s.newID()
	}

	now := s.now()
	summary := ""
	if payload, ok := llmData.(map[string]any); ok {
		if value := utils.StringValue(payload["summary"]); value != "" {
			summary = value
		} else {
			summary = utils.StringValue(payload["response"])
		}
	}

	return models.SimulationRun{
		ID:             id,
		ProjectID:      projectID,
		ScenarioName:   scenarioName,
		Provider:       provider,
		Status:         2,
		Questions:      questions,
		Overrides:      overrides,
		AgentsSnapshot: agentsSnapshot,
		StartedAt:      now,
		CompletedAt:    &now,
		Summary:        summary,
	}
}

func (s *APILLMService) mapLLMError(statusCode int, fallback string) error {
	if statusCode <= 0 {
		return &HTTPError{StatusCode: 500, Detail: fallback}
	}
	return &HTTPError{StatusCode: statusCode, Detail: fallback}
}

func (s *APILLMService) baseURL() string {
	if s != nil && s.BaseURL != "" {
		return s.BaseURL
	}
	return defaultLLMAPIURL
}

func (s *APILLMService) now() time.Time {
	if s != nil && s.Now != nil {
		return s.Now().UTC()
	}
	return time.Now().UTC()
}

func (s *APILLMService) newID() string {
	if s != nil && s.NewID != nil {
		return s.NewID()
	}
	return utils.NewUUID()
}

func targetModelToMap(targetModel models.TargetModel) map[string]any {
	return map[string]any{
		"id":                  targetModel.ID,
		"project_id":          targetModel.ProjectID,
		"name":                targetModel.Name,
		"age":                 targetModel.Age,
		"occupation":          targetModel.Occupation,
		"socioeconomic_level": targetModel.SocioeconomicLevel,
		"personality":         targetModel.Personality,
	}
}

func simulationRunToMap(run models.SimulationRun) map[string]any {
	return map[string]any{
		"id":              run.ID,
		"project_id":      run.ProjectID,
		"scenario_name":   run.ScenarioName,
		"provider":        run.Provider,
		"status":          run.Status,
		"questions":       run.Questions,
		"overrides":       run.Overrides,
		"agents_snapshot": run.AgentsSnapshot,
		"started_at":      run.StartedAt,
		"completed_at":    run.CompletedAt,
		"summary":         run.Summary,
	}
}
