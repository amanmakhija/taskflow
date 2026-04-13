package project

import (
	"context"
	"database/sql"
	"errors"
	"taskflow/internal/db"

	"github.com/jackc/pgx/v5"
)

func CreateProject(p *Project) error {
	query := `
	INSERT INTO projects (id, name, description, owner_id)
	VALUES ($1, $2, $3, $4)
	`

	_, err := db.Pool.Exec(context.Background(),
		query,
		p.ID,
		p.Name,
		p.Description,
		p.OwnerID,
	)

	return err
}

func GetProjectsByUser(userID string) ([]Project, error) {
	query := `
	SELECT id, name, description, owner_id, created_at
	FROM projects
	WHERE owner_id = $1
	`

	rows, err := db.Pool.Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project

	for rows.Next() {
		var p Project
		err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}

	return projects, nil
}

func GetProjectByID(id string) (*Project, error) {
	query := `
	SELECT id, name, description, owner_id, created_at
	FROM projects WHERE id = $1
	`

	row := db.Pool.QueryRow(context.Background(), query, id)

	var p Project
	err := row.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if err != nil {
		return nil, err
	}

	return &p, nil
}

func UpdateProject(p *Project) error {
	query := `
	UPDATE projects
	SET name = $1, description = $2
	WHERE id = $3
	`

	_, err := db.Pool.Exec(context.Background(),
		query,
		p.Name,
		p.Description,
		p.ID,
	)

	return err
}

func DeleteProject(id string) error {
	query := `DELETE FROM projects WHERE id = $1`

	_, err := db.Pool.Exec(context.Background(), query, id)
	return err
}

func GetProjectWithTasks(projectID string) (*Project, []map[string]interface{}, error) {
	project, err := GetProjectByID(projectID)
	if err != nil {
		return nil, nil, err
	}

	query := `
	SELECT t.id, t.title, t.status, t.priority, t.assignee_id, t.due_date, u.name
	FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
	WHERE t.project_id = $1
	`

	rows, err := db.Pool.Query(context.Background(), query, projectID)

	if err != nil {
		return nil, nil, err
	}

	defer rows.Close()

	var tasks []map[string]interface{}

	for rows.Next() {
		var (
			id, title, status, priority string
			assigneeID                  sql.NullString
			dueDate                     sql.NullTime
			assigneeName                sql.NullString
		)

		err := rows.Scan(&id, &title, &status, &priority, &assigneeID, &dueDate, &assigneeName)
		if err != nil {
			return nil, nil, err
		}

		var assignee *string
		var name string
		if assigneeID.Valid {
			assignee = &assigneeID.String
			name = assigneeName.String
		}

		var due *string
		if dueDate.Valid {
			formatted := dueDate.Time.Format("2006-01-02")
			due = &formatted
		}

		tasks = append(tasks, map[string]interface{}{
			"id":            id,
			"title":         title,
			"status":        status,
			"priority":      priority,
			"assignee_id":   assignee,
			"assignee_name": name,
			"due_date":      due,
		})
	}

	return project, tasks, nil
}

func GetProjectStats(projectID string) (map[string]int, map[string]int, error) {
	// status counts
	statusQuery := `
	SELECT status, COUNT(*)
	FROM tasks
	WHERE project_id = $1
	GROUP BY status
	`

	statusRows, err := db.Pool.Query(context.Background(), statusQuery, projectID)
	if err != nil {
		return nil, nil, err
	}
	defer statusRows.Close()

	statusCounts := make(map[string]int)

	for statusRows.Next() {
		var status string
		var count int
		if err := statusRows.Scan(&status, &count); err != nil {
			return nil, nil, err
		}
		statusCounts[status] = count
	}

	// assignee counts
	assigneeQuery := `
	SELECT assignee_id, COUNT(*)
	FROM tasks
	WHERE project_id = $1 AND assignee_id IS NOT NULL
	GROUP BY assignee_id
	`

	assigneeRows, err := db.Pool.Query(context.Background(), assigneeQuery, projectID)
	if err != nil {
		return nil, nil, err
	}
	defer assigneeRows.Close()

	assigneeCounts := make(map[string]int)

	for assigneeRows.Next() {
		var assigneeID string
		var count int
		if err := assigneeRows.Scan(&assigneeID, &count); err != nil {
			return nil, nil, err
		}
		assigneeCounts[assigneeID] = count
	}

	return statusCounts, assigneeCounts, nil
}
