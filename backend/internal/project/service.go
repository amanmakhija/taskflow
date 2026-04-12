package project

import (
	"time"

	"errors"

	"github.com/google/uuid"
)

type Service struct{}

func (s *Service) Create(name, description, userID string) (*Project, error) {
	project := &Project{
		ID:          uuid.NewString(),
		Name:        name,
		Description: description,
		OwnerID:     userID,
		CreatedAt:   time.Now(),
	}

	err := CreateProject(project)
	if err != nil {
		return nil, err
	}

	return project, nil
}

func (s *Service) List(userID string) ([]Project, error) {
	return GetProjectsByUser(userID)
}

func (s *Service) GetByID(projectID string) (*Project, []map[string]interface{}, error) {
	return GetProjectWithTasks(projectID)
}

func (s *Service) Update(projectID, userID, name, description string) error {
	project, err := GetProjectByID(projectID)
	if err != nil {
		return err
	}

	// 🔥 OWNER CHECK
	if project.OwnerID != userID {
		return errors.New("forbidden")
	}

	project.Name = name
	project.Description = description

	return UpdateProject(project)
}

func (s *Service) Delete(projectID, userID string) error {
	project, err := GetProjectByID(projectID)
	if err != nil {
		return err
	}

	// 🔥 OWNER CHECK
	if project.OwnerID != userID {
		return errors.New("forbidden")
	}

	return DeleteProject(projectID)
}
