package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestSetupPanelRequiresProductionBootstrapToken(t *testing.T) {
	body := []byte(`{"nickname":"admin","password":"long-password"}`)
	newApp := func() *fiber.App {
		app := fiber.New()
		app.Post("/setup", NewPanelHandler(newTestStateManager(t, "", ""), "bootstrap-secret", true).SetupPanel)
		return app
	}

	app := newApp()
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

	bodyToken := []byte(`{"nickname":"admin","password":"long-password","bootstrap_token":" bootstrap-secret\n"}`)
	resp, err = newApp().Test(httptest.NewRequest(http.MethodPost, "/setup", bytes.NewReader(bodyToken)))
	if err != nil {
		t.Fatalf("request with body token: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("with body token status = %d, want 200", resp.StatusCode)
	}
}
