package models

import "time"

type CompanyProfile struct {
	Name        string  `json:"name"`
	Website     *string `json:"website"`
	Industry    *string `json:"industry"`
	Description *string `json:"description"`
}

type User struct {
	ID        string         `json:"id"`
	FullName  string         `json:"full_name"`
	Email     string         `json:"email"`
	Company   CompanyProfile `json:"company"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

type TargetModel struct {
	ID                 string   `json:"id"`
	ProjectID          string   `json:"project_id"`
	Name               string   `json:"name"`
	Age                *int     `json:"age"`
	Occupation         *string  `json:"occupation"`
	SocioeconomicLevel *string  `json:"socioeconomic_level"`
	Personality        []string `json:"personality"`
}

type AgentProfile struct {
	ID          string   `json:"id"`
	ModelID     string   `json:"model_id"`
	Name        string   `json:"name"`
	Gender      *string  `json:"gender"`
	Segment     string   `json:"segment"`
	Motivations []string `json:"motivations"`
	Objections  []string `json:"objections"`
}

type ProjectContext struct {
	Description    *string `json:"description"`
	Category       *string `json:"category"`
	TargetAge      *string `json:"target_age"`
	TargetGender   *string `json:"target_gender"`
	SuggestedPrice *string `json:"suggested_price"`
}

type StatsResponse struct {
	DemandScore           *float64        `json:"demand_score"`
	WillingnessToPayScore *float64        `json:"willingness_to_pay_score"`
	ClarityScore          *float64        `json:"clarity_score"`
	ObjectionDistribution *map[string]int `json:"objection_distribution"`
	SentimentDistribution *map[string]int `json:"sentiment_distribution"`
}

type SimulationRun struct {
	ID             string                 `json:"id"`
	ProjectID      string                 `json:"project_id"`
	ScenarioName   string                 `json:"scenario_name"`
	Provider       string                 `json:"provider"`
	Status         int                    `json:"status"`
	Questions      []string               `json:"questions"`
	Overrides      map[string]interface{} `json:"overrides"`
	AgentsSnapshot []TargetModel          `json:"agents_snapshot"`
	StartedAt      time.Time              `json:"started_at"`
	CompletedAt    *time.Time             `json:"completed_at"`
	Summary        interface{}            `json:"summary"`
}

type Project struct {
	ID           string          `json:"id"`
	OwnerID      string          `json:"owner_id"`
	Name         string          `json:"name"`
	Context      *ProjectContext `json:"context"`
	TargetModels []TargetModel   `json:"target_models"`
	Agents       []AgentProfile  `json:"agents"`
	Stats        *StatsResponse  `json:"stats"`
	Simulations  []SimulationRun `json:"simulations"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}
