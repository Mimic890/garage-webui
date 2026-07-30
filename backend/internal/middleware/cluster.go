package middleware

import (
	"context"
	"strings"

	"Noooste/garage-ui/internal/services"
	"Noooste/garage-ui/internal/state"

	"github.com/gofiber/fiber/v3"
	"github.com/rs/zerolog/log"
)

// ClusterMiddleware extracts the X-Cluster-Id header, finds the corresponding
// cluster in the state manager, and injects the AdminService and S3Service
// into the request's context for downstream handlers to use.
func ClusterMiddleware(stateManager *state.Manager) fiber.Handler {
	return func(c fiber.Ctx) error {
		clusterID := c.Get("X-Cluster-Id")

		if clusterID == "" {
			path := c.Path()
			if strings.HasPrefix(path, "/api/v1/panel") || path == "/api/v1/capabilities" || path == "/api/v1/health" {
				return c.Next()
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "ERROR_400",
					"message": "Missing X-Cluster-Id header",
				},
			})
		}

		// Retrieve cluster config
		cfg, ok := stateManager.GetCluster(clusterID)
		if !ok {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "ERROR_400",
					"message": "Invalid or unknown X-Cluster-Id",
				},
			})
		}

		// Connect to the cluster's Admin API
		// We use debug level since we're creating this per-request.
		// A real app might cache these services, but ponytail rule: "lazy means less code".
		// We'll create it on the fly first. If it's slow, we add caching later.
		adminResult, err := services.NewAdminService(&cfg, "debug")
		if err != nil {
			log.Error().Err(err).Str("cluster_id", clusterID).Msg("Failed to connect to cluster admin API")
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "ERROR_502",
					"message": "Failed to connect to cluster: " + err.Error(),
				},
			})
		}
		adminService := adminResult.Service

		// Connect to S3 API
		s3Service := services.NewS3Service(&cfg, adminService)

		// Inject into fiber.Locals for handlers to retrieve
		c.Locals("adminService", adminService)
		c.Locals("s3Service", s3Service)

		// If we need standard context:
		_ = context.WithValue(c.Context(), "adminService", adminService)

		return c.Next()
	}
}

// StaticClusterMiddleware injects fixed Admin/S3 services on every request.
// Used by unit and route tests so handlers run without a live Garage cluster.
func StaticClusterMiddleware(admin services.AdminService, s3 services.S3Storage) fiber.Handler {
	return func(c fiber.Ctx) error {
		if admin != nil {
			c.Locals("adminService", admin)
		}
		if s3 != nil {
			c.Locals("s3Service", s3)
		}
		return c.Next()
	}
}
