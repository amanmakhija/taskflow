package project

import (
	"net/http"

	"taskflow/pkg/utils"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Service *Service
}

func (h *Handler) Create(c *gin.Context) {
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": "validation failed"})
		return
	}

	userID := utils.GetUserID(c)

	project, err := h.Service.Create(body.Name, body.Description, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, project)
}

func (h *Handler) List(c *gin.Context) {
	userID := utils.GetUserID(c)

	projects, err := h.Service.List(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch projects"})
		return
	}

	c.JSON(200, gin.H{"projects": projects})
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")

	project, tasks, err := h.Service.GetByID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}

	c.JSON(200, gin.H{
		"id":          project.ID,
		"name":        project.Name,
		"description": project.Description,
		"owner_id":    project.OwnerID,
		"tasks":       tasks,
	})
}

func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": "validation failed"})
		return
	}

	userID := utils.GetUserID(c)

	err := h.Service.Update(id, userID, body.Name, body.Description)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(403, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(404, gin.H{"error": "not found"})
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
