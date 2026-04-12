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
