package main

import (
	"log"
	"net/http"
	"taskflow/internal/auth"
	"taskflow/internal/config"
	"taskflow/internal/db"
	"taskflow/internal/middleware"
	"taskflow/internal/project"
	"taskflow/internal/task"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	db.Connect(cfg.DatabaseURL)
	r := gin.Default()

	authService := &auth.Service{JWTSecret: cfg.JWTSecret}
	authHandler := &auth.Handler{Service: authService}
	projectService := &project.Service{}
	projectHandler := &project.Handler{Service: projectService}
	taskService := &task.Service{}
	taskHandler := &task.Handler{Service: taskService}

	authMiddleware := middleware.AuthMiddleware(cfg.JWTSecret)

	// Public routes
	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)

	// Protected routes
	protected := r.Group("/")
	protected.Use(authMiddleware)

	protected.GET("/projects", projectHandler.List)
	protected.POST("/projects", projectHandler.Create)
	protected.GET("/projects/:id", projectHandler.GetByID)
	protected.PATCH("/projects/:id", projectHandler.Update)
	protected.DELETE("/projects/:id", projectHandler.Delete)
	protected.GET("/projects/:id/stats", projectHandler.Stats)

	protected.GET("/projects/:id/tasks", taskHandler.List)
	protected.POST("/projects/:id/tasks", taskHandler.Create)
	protected.PATCH("/tasks/:id", taskHandler.Update)
	protected.DELETE("/tasks/:id", taskHandler.Delete)

	// test route
	protected.GET("/me", func(c *gin.Context) {
		userID := c.GetString("user_id")
		c.JSON(200, gin.H{"user_id": userID})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	log.Println("Server running on :8080")
	r.Run(":8080")
}
