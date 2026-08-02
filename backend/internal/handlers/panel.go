package handlers

import (
	"Mimic890/garage-ui/internal/auth"
	"Mimic890/garage-ui/internal/models"
	"Mimic890/garage-ui/internal/state"
	"crypto/subtle"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type PanelHandler struct {
	stateManager   *state.Manager
	bootstrapToken string
	production     bool
}

func NewPanelHandler(stateManager *state.Manager, bootstrapToken string, production bool) *PanelHandler {
	return &PanelHandler{
		stateManager:   stateManager,
		bootstrapToken: bootstrapToken,
		production:     production,
	}
}

// GetSetupStatus checks if the panel has been set up yet
func (h *PanelHandler) GetSetupStatus(c fiber.Ctx) error {
	s := h.stateManager.GetState()
	return c.JSON(fiber.Map{
		"setup": s.Admin.Setup,
	})
}

type SetupRequest struct {
	Nickname       string `json:"nickname" validate:"required"`
	Password       string `json:"password" validate:"required,min=12"`
	BootstrapToken string `json:"bootstrap_token"`
}

// SetupPanel performs initial admin account setup
func (h *PanelHandler) SetupPanel(c fiber.Ctx) error {
	var req SetupRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body"))
	}

	if h.production {
		token := strings.TrimSpace(c.Get("X-Bootstrap-Token"))
		if token == "" {
			token = strings.TrimSpace(req.BootstrapToken)
		}
		bootstrapToken := strings.TrimSpace(h.bootstrapToken)
		if bootstrapToken == "" || token == "" || subtle.ConstantTimeCompare([]byte(token), []byte(bootstrapToken)) != 1 {
			return c.Status(fiber.StatusForbidden).JSON(models.ErrorResponse(models.ErrCodeForbidden, "Bootstrap token required"))
		}
	}

	if req.Nickname == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Nickname is required"))
	}

	var hashedPassword string
	if len(req.Password) < 12 {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Password must be at least 12 characters"))
	}
	{
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to hash password"))
		}
		hashedPassword = hash
	}

	admin := state.AdminAccount{
		Nickname: req.Nickname,
		Password: hashedPassword,
		Setup:    true,
	}

	claimed, err := h.stateManager.SetupAdmin(admin)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to save state"))
	}
	if !claimed {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, "Panel is already set up"))
	}

	return c.JSON(fiber.Map{"success": true})
}

// GetClusters lists all clusters
func (h *PanelHandler) GetClusters(c fiber.Ctx) error {
	s := h.stateManager.GetState()
	clusters := make([]fiber.Map, 0, len(s.Clusters))
	for _, cluster := range s.Clusters {
		clusters = append(clusters, fiber.Map{"id": cluster.ID, "name": cluster.Name, "endpoint": cluster.Endpoint, "region": cluster.Region, "use_ssl": cluster.UseSSL, "force_path_style": cluster.ForcePathStyle, "admin_endpoint": cluster.AdminEndpoint})
	}
	return c.JSON(fiber.Map{"success": true, "clusters": clusters})
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
	if err := state.ValidateClusterEndpoints(req.Endpoint, req.AdminEndpoint); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.ErrorResponse(models.ErrCodeBadRequest, err.Error()))
	}

	req.ID = uuid.New().String()

	if err := h.stateManager.AddCluster(req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to add cluster"))
	}

	return c.JSON(fiber.Map{"success": true, "cluster": fiber.Map{"id": req.ID, "name": req.Name, "endpoint": req.Endpoint, "region": req.Region, "use_ssl": req.UseSSL, "force_path_style": req.ForcePathStyle, "admin_endpoint": req.AdminEndpoint}})
}

// DeleteCluster removes a Garage cluster
func (h *PanelHandler) DeleteCluster(c fiber.Ctx) error {
	id := c.Params("id")
	if err := h.stateManager.RemoveCluster(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.ErrorResponse(models.ErrCodeInternalError, "Failed to remove cluster"))
	}

	return c.JSON(fiber.Map{"success": true})
}
