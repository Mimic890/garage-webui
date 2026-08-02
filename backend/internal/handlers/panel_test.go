package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestSetupPanelAllowsFirstRunSetupInProduction(t *testing.T) {
	body := []byte(`{"nickname":"admin","password":"long-password"}`)
	app := fiber.New()
	app.Post("/setup", NewPanelHandler(newTestStateManager(t, "", "")).SetupPanel)
	resp, err := app.Test(httptest.NewRequest(http.MethodPost, "/setup", bytes.NewReader(body)))
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}
