package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"backend-go/models"
	"backend-go/routes"
	"backend-go/services"
	"backend-go/utils"
	"github.com/gin-gonic/gin"
)

func main() {
	authProvider := newMemoryAuthProvider()
	userRepo := newMemoryUserRepo()
	projectRepo := newMemoryProjectRepo()
	targetModelRepo := newMemoryTargetModelRepo()
	simulationRepo := newMemorySimulationRepo()

	authService := services.NewAuthService(userRepo, projectRepo, authProvider)

	router := gin.Default()
	routes.RegisterHealthRoutes(router)
	routes.RegisterAuthRoutes(router, authProvider)
	routes.RegisterUserRoutes(router, authService, authProvider, userRepo)
	routes.RegisterProjectRoutes(router, authService, projectRepo, targetModelRepo, simulationRepo, nil)

	addr := ":" + envOrDefault("PORT", "8080")
	log.Printf("listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func envOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

type memoryAuthProvider struct {
	mu       sync.RWMutex
	users    map[string]memoryAuthAccount
	byEmail  map[string]string
	sessions map[string]string
}

type memoryAuthAccount struct {
	ID       string
	Email    string
	Password string
	Metadata map[string]any
}

func newMemoryAuthProvider() *memoryAuthProvider {
	return &memoryAuthProvider{
		users:    map[string]memoryAuthAccount{},
		byEmail:  map[string]string{},
		sessions: map[string]string{},
	}
}

func (p *memoryAuthProvider) SignUp(email, password string, metadata map[string]any) (*routes.AuthUser, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}
	if _, exists := p.byEmail[email]; exists {
		return nil, fmt.Errorf("user already exists")
	}

	userID := utils.NewUUID()
	p.users[userID] = memoryAuthAccount{
		ID:       userID,
		Email:    email,
		Password: password,
		Metadata: utils.CloneMap(metadata),
	}
	p.byEmail[email] = userID

	return &routes.AuthUser{
		ID:    userID,
		Email: email,
	}, nil
}

func (p *memoryAuthProvider) SignInWithPassword(email, password string) (map[string]any, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	userID, ok := p.byEmail[email]
	if !ok {
		return nil, fmt.Errorf("invalid credentials")
	}

	account := p.users[userID]
	if account.Password != password {
		return nil, fmt.Errorf("invalid credentials")
	}

	token := utils.NewUUID()
	p.sessions[token] = userID

	return map[string]any{
		"user": map[string]any{
			"id":    account.ID,
			"email": account.Email,
		},
		"session": map[string]any{
			"access_token": token,
			"token_type":   "bearer",
		},
	}, nil
}

func (p *memoryAuthProvider) SignOut(token string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	delete(p.sessions, token)
	return nil
}

func (p *memoryAuthProvider) GetUser(token string) (*services.AuthUser, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	userID, ok := p.sessions[token]
	if !ok {
		return nil, fmt.Errorf("invalid token")
	}

	account, ok := p.users[userID]
	if !ok {
		return nil, fmt.Errorf("invalid token")
	}

	return &services.AuthUser{
		ID:           account.ID,
		Email:        account.Email,
		UserMetadata: utils.CloneMap(account.Metadata),
	}, nil
}

type memoryUserRepo struct {
	mu    sync.RWMutex
	users map[string]map[string]any
}

func newMemoryUserRepo() *memoryUserRepo {
	return &memoryUserRepo{users: map[string]map[string]any{}}
}

func (r *memoryUserRepo) FindUserByID(userID string) (map[string]any, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	row, ok := r.users[userID]
	if !ok {
		return nil, nil
	}
	return utils.CloneMap(row), nil
}

func (r *memoryUserRepo) InsertUser(data map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	userID := utils.StringValue(data["id"])
	if userID == "" {
		return fmt.Errorf("id is required")
	}
	r.users[userID] = utils.CloneMap(data)
	return nil
}

func (r *memoryUserRepo) UpdateUser(userID string, data map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	current, ok := r.users[userID]
	if !ok {
		return &services.HTTPError{StatusCode: http.StatusNotFound, Detail: "User not found"}
	}

	for key, value := range data {
		current[key] = value
	}
	return nil
}

type memoryProjectRepo struct {
	mu       sync.RWMutex
	projects map[string]map[string]any
}

func newMemoryProjectRepo() *memoryProjectRepo {
	return &memoryProjectRepo{projects: map[string]map[string]any{}}
}

func (r *memoryProjectRepo) FindProjectByID(projectID string) (map[string]any, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	row, ok := r.projects[projectID]
	if !ok {
		return nil, nil
	}
	return utils.CloneMap(row), nil
}

func (r *memoryProjectRepo) ListProjectsByOwner(ownerID string) ([]map[string]any, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rows := []map[string]any{}
	for _, row := range r.projects {
		if utils.StringValue(row["owner_id"]) == ownerID {
			rows = append(rows, utils.CloneMap(row))
		}
	}
	return rows, nil
}

func (r *memoryProjectRepo) InsertProject(data map[string]any) (map[string]any, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	projectID := utils.NewUUID()
	row := utils.CloneMap(data)
	row["id"] = projectID
	r.projects[projectID] = row
	return utils.CloneMap(row), nil
}

func (r *memoryProjectRepo) UpdateProject(projectID string, data map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	current, ok := r.projects[projectID]
	if !ok {
		return &services.HTTPError{StatusCode: http.StatusNotFound, Detail: "Project not found"}
	}

	for key, value := range data {
		current[key] = value
	}
	return nil
}

func (r *memoryProjectRepo) DeleteProject(projectID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.projects, projectID)
	return nil
}

type memoryTargetModelRepo struct {
	mu     sync.RWMutex
	models map[string][]map[string]any
}

func newMemoryTargetModelRepo() *memoryTargetModelRepo {
	return &memoryTargetModelRepo{models: map[string][]map[string]any{}}
}

func (r *memoryTargetModelRepo) ListTargetModelsByProject(projectID string) ([]map[string]any, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rows := r.models[projectID]
	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		result = append(result, utils.CloneMap(row))
	}
	return result, nil
}

func (r *memoryTargetModelRepo) DeleteTargetModel(projectID, modelID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	current := r.models[projectID]
	filtered := current[:0]
	for _, row := range current {
		if utils.StringValue(row["id"]) != modelID {
			filtered = append(filtered, row)
		}
	}
	r.models[projectID] = filtered
	return nil
}

type memorySimulationRepo struct {
	mu   sync.RWMutex
	runs map[string][]map[string]any
}

func newMemorySimulationRepo() *memorySimulationRepo {
	return &memorySimulationRepo{runs: map[string][]map[string]any{}}
}

func (r *memorySimulationRepo) ListSimulationRunsByProject(projectID string) ([]map[string]any, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rows := r.runs[projectID]
	result := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		result = append(result, utils.CloneMap(row))
	}
	return result, nil
}

func (r *memorySimulationRepo) InsertSimulationRun(data map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	projectID := utils.StringValue(data["project_id"])
	r.runs[projectID] = append(r.runs[projectID], utils.CloneMap(data))
	return nil
}

func (r *memorySimulationRepo) UpdateSimulationRun(runID string, data map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for projectID, rows := range r.runs {
		for i := range rows {
			if utils.StringValue(rows[i]["id"]) == runID {
				for key, value := range data {
					rows[i][key] = value
				}
				r.runs[projectID] = rows
				return nil
			}
		}
	}
	return &services.HTTPError{StatusCode: http.StatusNotFound, Detail: "Simulation not found"}
}

var (
	_ routes.AuthProvider          = (*memoryAuthProvider)(nil)
	_ services.AuthProvider        = (*memoryAuthProvider)(nil)
	_ services.UserStore           = (*memoryUserRepo)(nil)
	_ routes.UserRepository        = (*memoryUserRepo)(nil)
	_ services.ProjectStore        = (*memoryProjectRepo)(nil)
	_ routes.ProjectRepository     = (*memoryProjectRepo)(nil)
	_ routes.TargetModelRepository = (*memoryTargetModelRepo)(nil)
	_ routes.SimulationRepository  = (*memorySimulationRepo)(nil)
	_ routes.AuthService           = (*services.AuthService)(nil)
	_ routes.ProjectRepository     = (*memoryProjectRepo)(nil)
	_ routes.TargetModelRepository = (*memoryTargetModelRepo)(nil)
	_ routes.SimulationRepository  = (*memorySimulationRepo)(nil)
	_ routes.UserRepository        = (*memoryUserRepo)(nil)
	_ models.ProjectContext        = models.ProjectContext{}
)
