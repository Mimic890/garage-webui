package handlers

import (
	"Noooste/garage-ui/internal/models"
	"Noooste/garage-ui/internal/state"
	"crypto/sha256"
	"encoding/hex"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type PanelHandler struct {
	stateManager *state.Manager
}

func NewPanelHandler(stateManager *state.Manager) *PanelHandler {
	return &PanelHandler{
		stateManager: stateManager,
	}
}

// GetSetupStatus checks if the panel has been set up yet
func (h *PanelHandler) GetSetupStatus(c fiber.Ctx) error {
	s := h.stateManager.GetState()
	return c.JSON(fiber.Map{
		"setup": s.Admin.Setup,
		"admin": fiber.Map{
			"nickname": s.Admin.Nickname,
		},
	})
}

type SetupRequest struct {
	Nickname string `json:"nickname" validate:"required"`
	Password string `json:"password"`
}

// SetupPanel performs initial admin account setup
func (h *PanelHandler) SetupPanel(c fiber.Ctx) error {
	s := h.stateManager.GetState()
	if s.Admin.Setup {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Panel is already set up"))
	}

	var req SetupRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body"))
	}

	if req.Nickname == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Nickname is required"))
	}

	var hashedPassword string
	if req.Password != "" {
		// Pre-hash with SHA-256 to bypass bcrypt's 72-byte limit
		hasher := sha256.New()
		hasher.Write([]byte(req.Password))
		sha256Hash := hex.EncodeToString(hasher.Sum(nil))

		hash, err := bcrypt.GenerateFromPassword([]byte(sha256Hash), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to hash password"))
		}
		hashedPassword = string(hash)
	}

	admin := state.AdminAccount{
		Nickname: req.Nickname,
		Password: hashedPassword,
		Setup:    true,
	}

	if err := h.stateManager.UpdateAdmin(admin); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to save state"))
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetClusters lists all clusters
func (h *PanelHandler) GetClusters(c fiber.Ctx) error {
	s := h.stateManager.GetState()
	return c.JSON(fiber.Map{"success": true, "clusters": s.Clusters})
}

// AddCluster adds a new Garage cluster
func (h *PanelHandler) AddCluster(c fiber.Ctx) error {
	var req state.ClusterConfig
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body"))
	}

	if req.Name == "" || req.Endpoint == "" || req.AdminEndpoint == "" || req.AdminToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Missing required fields"))
	}

	req.ID = uuid.New().String()

	if err := h.stateManager.AddCluster(req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to add cluster"))
	}

	return c.JSON(fiber.Map{"success": true, "cluster": req})
}

// DeleteCluster removes a Garage cluster
func (h *PanelHandler) DeleteCluster(c fiber.Ctx) error {
	id := c.Params("id")
	if err := h.stateManager.RemoveCluster(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to remove cluster"))
	}

	return c.JSON(fiber.Map{"success": true})
}
