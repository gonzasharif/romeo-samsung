package schemas

import (
	"backend-go/models"
)

type UserCreate struct {
	FullName string                `json:"full_name"`
	Email    string                `json:"email"`
	Password string                `json:"password"`
	Company  models.CompanyProfile `json:"company"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserUpdate struct {
	FullName *string                `json:"full_name,omitempty"`
	Email    *string                `json:"email,omitempty"`
	Company  *models.CompanyProfile `json:"company,omitempty"`
}

type ProjectCreate struct {
	Name    string                `json:"name"`
	Context models.ProjectContext `json:"context"`
}

type ProjectUpdate struct {
	Name    *string                `json:"name,omitempty"`
	Context *models.ProjectContext `json:"context,omitempty"`
}

type TargetModelCreate struct {
	Name               string   `json:"name"`
	Age                *int     `json:"age,omitempty"`
	Occupation         *string  `json:"occupation,omitempty"`
	SocioeconomicLevel *string  `json:"socioeconomic_level,omitempty"`
	Personality        []string `json:"personality"`
}

type TargetModelUpdate struct {
	Name               *string   `json:"name,omitempty"`
	Age                *int      `json:"age,omitempty"`
	Occupation         *string   `json:"occupation,omitempty"`
	SocioeconomicLevel *string   `json:"socioeconomic_level,omitempty"`
	Personality        *[]string `json:"personality,omitempty"`
}

type AgentCreate struct {
	Name        string   `json:"name"`
	Gender      *string  `json:"gender,omitempty"`
	Segment     string   `json:"segment"`
	Motivations []string `json:"motivations"`
	Objections  []string `json:"objections"`
}

type AgentUpdate struct {
	ModelID     *string   `json:"model_id,omitempty"`
	Name        *string   `json:"name,omitempty"`
	Gender      *string   `json:"gender,omitempty"`
	Segment     *string   `json:"segment,omitempty"`
	Motivations *[]string `json:"motivations,omitempty"`
	Objections  *[]string `json:"objections,omitempty"`
}

type Provider string

const (
	ProviderOpenAI Provider = "openai"
	ProviderGemini Provider = "gemini"
	ProviderClaude Provider = "claude"
	ProviderMock   Provider = "mock"
)

type SimulationCreate struct {
	ScenarioName string   `json:"scenario_name"`
	Questions    []string `json:"questions"`
	Provider     Provider `json:"provider"`
}
