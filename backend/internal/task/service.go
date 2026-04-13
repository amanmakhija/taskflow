package task

import (
	"errors"
	"time"

	"taskflow/internal/project"

	"github.com/google/uuid"
)

type Service struct{}

func (s *Service) Create(projectID, userID, title, desc, priority string) (*Task, error) {
	// check project exists
	p, err := project.GetProjectByID(projectID)
	if err != nil {
		return nil, err
	}

	task := &Task{
		ID:          uuid.NewString(),
		Title:       title,
		Description: &desc,
		Status:      "todo",
		Priority:    priority,
		ProjectID:   p.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = CreateTask(task)
	if err != nil {
		return nil, err
	}

	return task, nil
}

func (s *Service) List(projectID, status, assignee string) ([]Task, error) {
	return GetTasks(projectID, status, assignee)
}

func (s *Service) Update(taskID string, updates Task) error {
	task, err := GetTaskByID(taskID)
	if err != nil {
		return err
	}

	// apply updates
	if updates.Title != "" {
		task.Title = updates.Title
	}
	if updates.Description != nil && *updates.Description != "" {
		task.Description = updates.Description
	}
	if updates.Status != "" {
		task.Status = updates.Status
	}
	if updates.Priority != "" {
		task.Priority = updates.Priority
	}
	if updates.AssigneeID != nil {
		task.AssigneeID = updates.AssigneeID
	}
	if updates.DueDate != nil {
		task.DueDate = updates.DueDate
	}

	return UpdateTask(task)
}

func (s *Service) Delete(taskID, userID string) error {
	task, err := GetTaskByID(taskID)
	if err != nil {
		return err
	}

	project, err := project.GetProjectByID(task.ProjectID)
	if err != nil {
		return err
	}

	// 🔥 authorization
	if project.OwnerID != userID {
		return errors.New("forbidden")
	}

	return DeleteTask(taskID)
}
