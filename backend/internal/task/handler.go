package task

import (
	"net/http"
	"time"

	"taskflow/pkg/utils"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Service *Service
}

func (h *Handler) Create(c *gin.Context) {
	projectID := c.Param("id")

	var body struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": "validation failed"})
		return
	}

	userID := utils.GetUserID(c)

	task, err := h.Service.Create(projectID, userID, body.Title, body.Description, body.Priority)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *Handler) List(c *gin.Context) {
	projectID := c.Param("id")
	status := c.Query("status")
	assignee := c.Query("assignee")

	tasks, err := h.Service.List(projectID, status, assignee)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed"})
		return
	}

	c.JSON(200, gin.H{"tasks": tasks})
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "validation failed"})
		return
	}

	// 🔥 convert to Task model
	var task Task

	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = req.Description
	}
	if req.Status != nil {
		task.Status = *req.Status
	}
	if req.Priority != nil {
		task.Priority = *req.Priority
	}
	if req.AssigneeID != nil {
		task.AssigneeID = req.AssigneeID
	}

	if req.DueDate != nil {
		parsed, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			c.JSON(400, gin.H{"error": "invalid date format (YYYY-MM-DD required)"})
			return
		}
		task.DueDate = &parsed
	}

	if req.Status != nil {
		valid := map[string]bool{
			"todo":        true,
			"in_progress": true,
			"done":        true,
		}
		if !valid[*req.Status] {
			c.JSON(400, gin.H{"error": "invalid status"})
			return
		}
	}

	err := h.Service.Update(id, task)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "updated"})
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	userID := utils.GetUserID(c)

	err := h.Service.Delete(id, userID)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(403, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(404, gin.H{"error": "not found"})
		return
	}

	c.Status(204)
}
