package task

import (
	"context"
	"taskflow/internal/db"
)

func CreateTask(t *Task) error {
	query := `
	INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, due_date)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`

	_, err := db.Pool.Exec(context.Background(),
		query,
		t.ID, t.Title, t.Description, t.Status,
		t.Priority, t.ProjectID, t.AssigneeID, t.DueDate,
	)

	return err
}

func GetTasks(projectID, status, assignee string) ([]Task, error) {
	query := `
	SELECT id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at
	FROM tasks WHERE project_id = $1
	`

	args := []interface{}{projectID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}

	rows, err := db.Pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []Task

	for rows.Next() {
		var t Task
		var desc *string
		err := rows.Scan(
			&t.ID, &t.Title, &desc,
			&t.Status, &t.Priority,
			&t.ProjectID, &t.AssigneeID,
			&t.DueDate, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		t.Description = desc
		tasks = append(tasks, t)
	}

	return tasks, nil
}

func GetTaskByID(id string) (*Task, error) {
	query := `
	SELECT id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at
	FROM tasks WHERE id = $1
	`

	row := db.Pool.QueryRow(context.Background(), query, id)

	var t Task
	var desc *string
	err := row.Scan(
		&t.ID, &t.Title, &desc,
		&t.Status, &t.Priority,
		&t.ProjectID, &t.AssigneeID,
		&t.DueDate, &t.CreatedAt, &t.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	t.Description = desc
	return &t, nil
}

func UpdateTask(t *Task) error {
	query := `
	UPDATE tasks
	SET title=$1, description=$2, status=$3, priority=$4, assignee_id=$5, due_date=$6, updated_at=NOW()
	WHERE id=$7
	`

	_, err := db.Pool.Exec(context.Background(),
		query,
		t.Title, t.Description, t.Status,
		t.Priority, t.AssigneeID, t.DueDate, t.ID,
	)

	return err
}

func DeleteTask(id string) error {
	query := `DELETE FROM tasks WHERE id=$1`
	_, err := db.Pool.Exec(context.Background(), query, id)
	return err
}
