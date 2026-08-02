package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestCSRFOrigin_AllowsPanelSetupWithStaleCookie(t *testing.T) {
	app := fiber.New()
	app.Use(CSRFOrigin("http://ui.example"))
	app.Post("/api/v1/panel/setup", func(c fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/panel/setup", nil)
	req.AddCookie(&http.Cookie{Name: "garage_session", Value: "stale"})
	req.Header.Set("Origin", "http://other.example")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", resp.StatusCode)
	}
}
