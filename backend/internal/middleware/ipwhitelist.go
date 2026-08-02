package middleware

import (
	"Mimic890/garage-ui/internal/config"
	"Mimic890/garage-ui/pkg/logger"
	"net"
	"strings"

	"github.com/gofiber/fiber/v3"
)

// IPWhitelistMiddleware blocks requests from IPs not in the configured AllowedIPs list
func IPWhitelistMiddleware(cfg *config.ServerConfig) fiber.Handler {
	return func(c fiber.Ctx) error {
		if len(cfg.AllowedIPs) == 0 {
			// No whitelist configured, allow all
			return c.Next()
		}

		clientIP := c.IP()
		parsedClientIP := net.ParseIP(clientIP)

		for _, allowed := range cfg.AllowedIPs {
			allowed = strings.TrimSpace(allowed)
			if allowed == "" {
				continue
			}

			// Check if it's a CIDR block
			if strings.Contains(allowed, "/") {
				_, ipNet, err := net.ParseCIDR(allowed)
				if err == nil && ipNet.Contains(parsedClientIP) {
					return c.Next()
				}
			} else {
				// Exact IP match
				if allowed == clientIP {
					return c.Next()
				}
			}
		}

		logger.Warn().
			Str("ip", clientIP).
			Msg("Request blocked by IP Whitelist")

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied: your IP address is not whitelisted",
		})
	}
}
