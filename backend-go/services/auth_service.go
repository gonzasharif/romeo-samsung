package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"backend-go/models"
	"backend-go/utils"
)

const (
	StatusBadRequest   = 400
	StatusUnauthorized = 401
	StatusForbidden    = 403
	StatusNotFound     = 404
)

type HTTPError struct {
	StatusCode int
	Detail     string
}

func (e *HTTPError) Error() string {
	return e.Detail
}

type UserStore interface {
	FindUserByID(userID string) (map[string]any, error)
	InsertUser(userData map[string]any) error
}

type ProjectStore interface {
	FindProjectByID(projectID string) (map[string]any, error)
}

type AuthProvider interface {
	GetUser(token string) (*AuthUser, error)
}

type AuthUser struct {
	ID           string
	Email        string
	UserMetadata map[string]any
}

type AuthService struct {
	Users    UserStore
	Projects ProjectStore
	Auth     AuthProvider
	Now      func() time.Time
}

func NewAuthService(users UserStore, projects ProjectStore, auth AuthProvider) *AuthService {
	return &AuthService{
		Users:    users,
		Projects: projects,
		Auth:     auth,
		Now:      time.Now().UTC,
	}
}

func (s *AuthService) GetUserOr404(userID string) (models.User, error) {
	if s.Users == nil {
		return models.User{}, errors.New("user store is not configured")
	}

	data, err := s.Users.FindUserByID(userID)
	if err != nil {
		return models.User{}, err
	}
	if len(data) == 0 {
		return models.User{}, &HTTPError{StatusCode: StatusNotFound, Detail: "User not found"}
	}

	normalized := utils.CloneMap(data)
	normalized["company"] = utils.NormalizeCompany(normalized["company"])
	normalized["created_at"] = utils.NormalizeTimestamp(normalized["created_at"], s.now())
	normalized["updated_at"] = utils.NormalizeTimestamp(normalized["updated_at"], s.now())
	normalized["full_name"] = utils.NormalizeString(normalized["full_name"], "Usuario")

	var user models.User
	if err := utils.DecodeInto(normalized, &user); err != nil {
		return models.User{}, fmt.Errorf("decode user: %w", err)
	}

	return user, nil
}

func (s *AuthService) GetProjectOr404(projectID string) (models.Project, error) {
	if s.Projects == nil {
		return models.Project{}, errors.New("project store is not configured")
	}

	data, err := s.Projects.FindProjectByID(projectID)
	if err != nil {
		return models.Project{}, err
	}
	if len(data) == 0 {
		return models.Project{}, &HTTPError{StatusCode: StatusNotFound, Detail: "Project not found"}
	}

	var project models.Project
	if err := utils.DecodeInto(data, &project); err != nil {
		return models.Project{}, fmt.Errorf("decode project: %w", err)
	}

	return project, nil
}

func (s *AuthService) GetAuthenticatedUser(token string) (models.User, error) {
	if s.Auth == nil {
		return models.User{}, errors.New("auth provider is not configured")
	}
	if token == "" {
		return models.User{}, &HTTPError{StatusCode: StatusUnauthorized, Detail: "Invalid token"}
	}

	authUser, err := s.Auth.GetUser(token)
	if err != nil {
		return models.User{}, &HTTPError{StatusCode: StatusUnauthorized, Detail: err.Error()}
	}
	if authUser == nil || authUser.ID == "" {
		return models.User{}, &HTTPError{StatusCode: StatusUnauthorized, Detail: "Invalid token"}
	}

	user, err := s.GetUserOr404(authUser.ID)
	if err == nil {
		return user, nil
	}

	var httpErr *HTTPError
	if !errors.As(err, &httpErr) || httpErr.StatusCode != StatusNotFound {
		return models.User{}, err
	}

	meta := authUser.UserMetadata
	if meta == nil {
		meta = map[string]any{}
	}

	timestamp := s.now().Format(time.RFC3339)
	companyPayload, marshalErr := json.Marshal(map[string]any{
		"name": utils.NormalizeString(meta["company_name"], "Empresa"),
	})
	if marshalErr != nil {
		return models.User{}, &HTTPError{StatusCode: StatusBadRequest, Detail: fmt.Sprintf("Failed to auto-create user profile: %v", marshalErr)}
	}

	userData := map[string]any{
		"id":         authUser.ID,
		"full_name":  utils.NormalizeString(meta["full_name"], "Usuario"),
		"email":      authUser.Email,
		"company":    string(companyPayload),
		"created_at": timestamp,
		"updated_at": timestamp,
	}

	if err := s.Users.InsertUser(userData); err != nil {
		return models.User{}, &HTTPError{StatusCode: StatusBadRequest, Detail: fmt.Sprintf("Failed to auto-create user profile: %v", err)}
	}

	return s.GetUserOr404(authUser.ID)
}

func AssertProjectOwner(project models.Project, user models.User) error {
	if project.OwnerID != user.ID {
		return &HTTPError{StatusCode: StatusForbidden, Detail: "Forbidden"}
	}

	return nil
}

func (s *AuthService) now() time.Time {
	if s != nil && s.Now != nil {
		return s.Now().UTC()
	}

	return time.Now().UTC()
}
