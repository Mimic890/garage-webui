package middleware

import (
	"context"
	"github.com/gofiber/fiber/v3"
	"net/url"
	"strings"
	"sync"
	"time"
)

func SecurityHeaders() fiber.Handler {
	return func(c fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("Referrer-Policy", "no-referrer")
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
		c.Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
		return c.Next()
	}
}

func RequestTimeout(d time.Duration) fiber.Handler {
	return func(c fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), d)
		defer cancel()
		c.SetContext(ctx)
		return c.Next()
	}
}

func CSRFOrigin(rootURL string, cookieNames ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		if c.Path() == "/api/v1/panel/setup" {
			return c.Next()
		}
		if c.Method() == fiber.MethodGet || c.Method() == fiber.MethodHead || c.Method() == fiber.MethodOptions {
			return c.Next()
		}
		authCookie := c.Cookies("garage_session")
		for _, name := range cookieNames {
			if name != "" {
				authCookie = c.Cookies(name)
				break
			}
		}
		if authCookie == "" {
			return c.Next()
		}
		origin := c.Get("Origin")
		if origin == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "origin required"})
		}
		o, err := url.Parse(origin)
		r, rerr := url.Parse(rootURL)
		if err != nil || rerr != nil || o.Scheme != r.Scheme || !strings.EqualFold(o.Host, r.Host) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "origin rejected"})
		}
		return c.Next()
	}
}

func RateLimit(max int, window time.Duration) fiber.Handler {
	var mu sync.Mutex
	seen := map[string][]time.Time{}
	return func(c fiber.Ctx) error {
		now, key := time.Now(), c.IP()
		mu.Lock()
		items := seen[key][:0]
		for _, at := range seen[key] {
			if now.Sub(at) < window {
				items = append(items, at)
			}
		}
		if len(items) >= max {
			mu.Unlock()
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "rate limit exceeded"})
		}
		seen[key] = append(items, now)
		mu.Unlock()
		return c.Next()
	}
}
