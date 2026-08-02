package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestSetupPanelRequiresProductionBootstrapToken(t *testing.T) {
	app := fiber.New()
	h := NewPanelHandler(newTestStateManager(t, "", ""), "bootstrap-secret", true)
	app.Post("/setup", h.SetupPanel)
	body := []byte(`{"nickname":"admin","password":"long-password"}`)

	resp, err := app.Test(httptest.NewRequest(http.MethodPost, "/setup", bytes.NewReader(body)))
	if err != nil {
		t.Fatalf("request without token: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("without token status = %d, want 403", resp.StatusCode)
	}

	req := httptest.NewRequest(http.MethodPost, "/setup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Bootstrap-Token", " bootstrap-secret\n")
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("request with token: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("with token status = %d, want 200", resp.StatusCode)
	}
}
