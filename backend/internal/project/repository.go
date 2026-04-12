package project

import (
	"context"
	"taskflow/internal/db"
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
	if err != nil {
		return nil, err
	}

	return &p, nil
}
