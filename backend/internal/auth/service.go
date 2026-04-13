package auth

import (
	"errors"
	"time"

	"taskflow/pkg/utils"

	"github.com/google/uuid"
)

type Service struct {
	JWTSecret string
}

func (s *Service) Register(req RegisterRequest) (*User, string, error) {
	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, "", err
	}

	user := &User{
		ID:        uuid.NewString(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  hashed,
		CreatedAt: time.Now(),
	}

	err = CreateUser(user)
	if err != nil {
		return nil, "", err
	}

	token, err := utils.GenerateToken(user.ID, user.Email, s.JWTSecret)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *Service) Login(req LoginRequest) (*User, string, error) {
	user, err := GetUserByEmail(req.Email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	err = utils.CheckPassword(req.Password, user.Password)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(user.ID, user.Email, s.JWTSecret)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *Service) GetUsers() ([]*User, error) {
	return GetAllUsers()
}
