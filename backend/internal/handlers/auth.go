package handlers

import (
	"Noooste/garage-ui/internal/auth"
	"Noooste/garage-ui/internal/config"
	"Noooste/garage-ui/internal/models"
	"Noooste/garage-ui/internal/state"

	"crypto/sha256"
	"encoding/hex"

	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	cfg          *config.Config
	authService  *auth.Service
	stateManager *state.Manager
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(cfg *config.Config, authService *auth.Service, stateManager *state.Manager) *AuthHandler {
	return &AuthHandler{
		cfg:          cfg,
		authService:  authService,
		stateManager: stateManager,
	}
}

// GetAuthConfig returns the current authentication configuration
//
//	@Summary		Get authentication configuration
//	@Description	Returns the current auth configuration (admin and/or OIDC)
//	@Tags			auth
//	@Produce		json
//	@Success		200	{object}	object{admin=object,oidc=object}	"Auth config"
//	@Router			/auth/config [get]
func (h *AuthHandler) GetAuthConfig(c fiber.Ctx) error {
	response := fiber.Map{
		"admin": fiber.Map{
			"enabled": true, // Admin is now always enabled since it's the core local account
		},
		"oidc": fiber.Map{
			"enabled": h.cfg.Auth.OIDC.Enabled,
		},
		"token": fiber.Map{
			"enabled": h.cfg.Auth.Token.Enabled,
		},
		"server": fiber.Map{
			"host": h.cfg.Server.Host,
			"port": h.cfg.Server.Port,
			"protocol": h.cfg.Server.Protocol,
			"root_url": h.cfg.Server.RootURL,
			"allowed_ips": h.cfg.Server.AllowedIPs,
			"max_body_size": h.cfg.Server.MaxBodySize,
			"max_header_size": h.cfg.Server.MaxHeaderSize,
			"read_buffer_size": h.cfg.Server.ReadBufferSize,
			"write_buffer_size": h.cfg.Server.WriteBufferSize,
		},
		"logging": fiber.Map{
			"level": h.cfg.Logging.Level,
			"format": h.cfg.Logging.Format,
		},
	}

	// Add provider name if OIDC is enabled
	if h.cfg.Auth.OIDC.Enabled {
		provider := h.cfg.Auth.OIDC.ProviderName
		if provider == "" {
			provider = "OIDC Provider"
		}
		response["oidc"].(fiber.Map)["provider"] = provider
	}

	return c.JSON(response)
}

// LoginBasicRequest represents the basic auth login request
type LoginBasicRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password"`
}

// LoginAdmin handles admin authentication login
//
//	@Summary		Admin auth login
//	@Description	Authenticate with admin username and password, returns JWT token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			credentials	body		LoginBasicRequest								true	"Login credentials"
//	@Success		200			{object}	object{success=bool,token=string,user=object}	"Login successful"
//	@Failure		400			{object}	models.APIResponse								"Invalid request"
//	@Failure		401			{object}	models.APIResponse								"Invalid credentials"
//	@Router			/auth/login [post]
func (h *AuthHandler) LoginAdmin(c fiber.Ctx) error {
	// Parse request body
	var req LoginBasicRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body"),
		)
	}

	// Validate credentials against state manager
	s := h.stateManager.GetState()
	if !s.Admin.Setup {
		return c.Status(fiber.StatusUnauthorized).JSON(
			models.ErrorResponse(models.ErrCodeUnauthorized, "Panel setup not completed"),
		)
	}

	if req.Username != s.Admin.Nickname {
		return c.Status(fiber.StatusUnauthorized).JSON(
			models.ErrorResponse(models.ErrCodeUnauthorized, "Invalid credentials"),
		)
	}

	if s.Admin.Password != "" {
		// Pre-hash the provided password with SHA-256 to match setup
		hasher := sha256.New()
		hasher.Write([]byte(req.Password))
		sha256Hash := hex.EncodeToString(hasher.Sum(nil))

		if err := bcrypt.CompareHashAndPassword([]byte(s.Admin.Password), []byte(sha256Hash)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(
				models.ErrorResponse(models.ErrCodeUnauthorized, "Invalid credentials"),
			)
		}
	} else {
		// If no password is set but setup is true, allow empty password?
		// "лучше просто задать никнейм а пароль установить позже"
		if req.Password != "" {
			return c.Status(fiber.StatusUnauthorized).JSON(
				models.ErrorResponse(models.ErrCodeUnauthorized, "Invalid credentials"),
			)
		}
	}

	// Create user info object
	userInfo := &auth.UserInfo{
		Username:   req.Username,
		AuthMethod: "admin",
	}

	// Generate JWT session token
	sessionToken, err := h.authService.GenerateSessionToken(userInfo)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to create session"),
		)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"token":   sessionToken,
		"user": fiber.Map{
			"username": userInfo.Username,
		},
	})
}

// GetMe returns the current authenticated user's information
//
//	@Summary		Get current user
//	@Description	Returns information about the currently authenticated user
//	@Tags			auth
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{object}	object{success=bool,user=object}	"User information"
//	@Failure		401	{object}	models.APIResponse					"Not authenticated"
//	@Router			/auth/me [get]
func (h *AuthHandler) GetMe(c fiber.Ctx) error {
	// Try to get user info from OIDC context
	userInfoInterface := c.Locals("userInfo")
	if userInfoInterface != nil {
		userInfo, ok := userInfoInterface.(*auth.UserInfo)
		if ok {
			return c.JSON(fiber.Map{
				"success": true,
				"user": fiber.Map{
					"username": userInfo.Username,
					"email":    userInfo.Email,
					"name":     userInfo.Name,
				},
			})
		}
	}

	// Try to get username from basic auth context
	usernameInterface := c.Locals("username")
	if usernameInterface != nil {
		username, ok := usernameInterface.(string)
		if ok {
			return c.JSON(fiber.Map{
				"success": true,
				"user": fiber.Map{
					"username": username,
				},
			})
		}
	}

	return c.Status(fiber.StatusUnauthorized).JSON(
		models.ErrorResponse(models.ErrCodeUnauthorized, "Not authenticated"),
	)
}
