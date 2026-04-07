package routes

import (
	"net/http"

	"backend-go/models"
)

type AuthService interface {
	GetUserOr404(userID string) (models.User, error)
	GetProjectOr404(projectID string) (models.Project, error)
	GetAuthenticatedUser(token string) (models.User, error)
}

type AuthProvider interface {
	SignInWithPassword(email, password string) (map[string]any, error)
	SignUp(email, password string, metadata map[string]any) (*AuthUser, error)
	SignOut(token string) error
}

type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type UserRepository interface {
	InsertUser(data map[string]any) error
	UpdateUser(userID string, data map[string]any) error
}

type ProjectRepository interface {
	ListProjectsByOwner(ownerID string) ([]map[string]any, error)
	InsertProject(data map[string]any) (map[string]any, error)
	UpdateProject(projectID string, data map[string]any) error
	DeleteProject(projectID string) error
}

type TargetModelRepository interface {
	ListTargetModelsByProject(projectID string) ([]map[string]any, error)
	DeleteTargetModel(projectID, modelID string) error
}

type SimulationRepository interface {
	ListSimulationRunsByProject(projectID string) ([]map[string]any, error)
	InsertSimulationRun(data map[string]any) error
	UpdateSimulationRun(runID string, data map[string]any) error
}

type APILLMService interface {
	GetModels() (map[string]any, error)
	StartModel(requestData map[string]any) (map[string]any, error)
	AskModel(requestData map[string]any) (map[string]any, error)
	StopModel(modelID string) (map[string]any, error)
	CreatePeopleModel(requestData map[string]any) (map[string]any, error)
}

type Dependencies struct {
	Auth         AuthService
	AuthProvider AuthProvider
	Users        UserRepository
	Projects     ProjectRepository
	TargetModels TargetModelRepository
	Simulations  SimulationRepository
	LLM          APILLMService
}

func Register(mux *http.ServeMux, deps Dependencies) {
	RegisterHealthRoutes(mux)
	RegisterAuthRoutes(mux, deps.AuthProvider)
	RegisterUserRoutes(mux, deps.Auth, deps.AuthProvider, deps.Users)
	RegisterAPILLMRoutes(mux, deps.LLM)
	RegisterProjectRoutes(mux, deps.Auth, deps.Projects, deps.TargetModels, deps.Simulations, deps.LLM)
}
