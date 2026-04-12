package auth

import (
	"context"
	"taskflow/internal/db"
)

func CreateUser(user *User) error {
	query := `
	INSERT INTO users (id, name, email, password)
	VALUES ($1, $2, $3, $4)
	`

	_, err := db.Pool.Exec(context.Background(),
		query,
		user.ID,
		user.Name,
		user.Email,
		user.Password,
	)

	return err
}

func GetUserByEmail(email string) (*User, error) {
	query := `
	SELECT id, name, email, password, created_at
	FROM users
	WHERE email = $1
	`

	row := db.Pool.QueryRow(context.Background(), query, email)

	var user User
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
