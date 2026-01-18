package middleware

import (
	"Noooste/garage-ui/internal/auth"
	"Noooste/garage-ui/internal/config"
	"Noooste/garage-ui/internal/models"

	"github.com/gofiber/fiber/v3"
)

// AuthMiddleware supports admin and OIDC authentication
func AuthMiddleware(cfg *config.AuthConfig, authService *auth.Service) fiber.Handler {
	return func(c fiber.Ctx) error {
		// If no auth is enabled, allow all requests
		if !cfg.Admin.Enabled && !cfg.OIDC.Enabled {
			return c.Next()
		}

		// Get Authorization header
		authHeader := c.Get("Authorization")

		// Try admin auth if enabled and header is present
		if cfg.Admin.Enabled && authHeader != "" {
			// Check if it's a Bearer token (JWT from admin login)
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				token := authHeader[7:]

				// Validate JWT session token
				userInfo, err := authService.ValidateSessionToken(token)
				if err == nil {
					// Valid admin token
					c.Locals("userInfo", userInfo)
					c.Locals("username", userInfo.Username)
					if userInfo.Email != "" {
						c.Locals("email", userInfo.Email)
					}
					return c.Next()
				}
			}
		}

		// Try OIDC auth if enabled
		if cfg.OIDC.Enabled {
			sessionCookie := c.Cookies(cfg.OIDC.CookieName)
			if sessionCookie != "" {
				// Validate JWT session token from cookie
				userInfo, err := authService.ValidateSessionToken(sessionCookie)
				if err == nil {
					// Valid OIDC token
					c.Locals("userInfo", userInfo)
					c.Locals("username", userInfo.Username)
					c.Locals("email", userInfo.Email)
					return c.Next()
				}
			}
		}

		// No valid authentication found
		return c.Status(fiber.StatusUnauthorized).JSON(
			models.ErrorResponse(models.ErrCodeUnauthorized, "Authentication required"),
		)
	}
}
