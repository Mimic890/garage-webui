package state

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestNewManager_CreatesAndPersists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "state.json")

	m, err := NewManager(path)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("state file not created: %v", err)
	}

	if err := m.UpdateAdmin(AdminAccount{Nickname: "alice", Password: "hash", Setup: true}); err != nil {
		t.Fatalf("UpdateAdmin: %v", err)
	}

	m2, err := NewManager(path)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	s := m2.GetState()
	if s.Admin.Nickname != "alice" || !s.Admin.Setup {
		t.Errorf("reloaded admin = %+v", s.Admin)
	}
}

func TestAdminMigrationMutationAndDeepCopy(t *testing.T) {
	path := filepath.Join(t.TempDir(), "state.json")
	legacy := State{Admin: AdminAccount{Nickname: "admin", Password: "hash", Setup: true}}
	data, _ := json.Marshal(legacy)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}
	m, err := NewManager(path)
	if err != nil {
		t.Fatal(err)
	}
	admin := m.GetState().Admin
	if admin.SecurityVersion != CurrentSecurityVersion || len(admin.WebAuthnUserHandle) != 64 {
		t.Fatalf("migration did not initialize security state: %+v", admin)
	}
	stableHandle := append([]byte(nil), admin.WebAuthnUserHandle...)
	admin.WebAuthnUserHandle[0] ^= 0xff
	if m.GetState().Admin.WebAuthnUserHandle[0] != stableHandle[0] {
		t.Fatal("GetState exposed mutable account state")
	}
	if err := m.MutateAdmin(func(a *AdminAccount) error { a.Email = "changed@example.com"; return errors.New("stop") }); err == nil {
		t.Fatal("expected mutation error")
	}
	if m.GetState().Admin.Email != "" {
		t.Fatal("failed mutation became visible")
	}
	if err := m.MutateAdmin(func(a *AdminAccount) error { a.Email = "admin@example.com"; return nil }); err != nil {
		t.Fatal(err)
	}
	reloaded, err := NewManager(path)
	if err != nil {
		t.Fatal(err)
	}
	if reloaded.GetState().Admin.Email != "admin@example.com" || string(reloaded.GetState().Admin.WebAuthnUserHandle) != string(stableHandle) {
		t.Fatal("mutation or stable handle was not persisted")
	}
}

func TestNewManager_PermissionDenied(t *testing.T) {
	dir := t.TempDir()
	// Make directory unreadable/unwritable for the current process by removing all bits.
	// Skip if running as root (common in some CI containers).
	if os.Geteuid() == 0 {
		t.Skip("cannot test permission denial as root")
	}
	if err := os.Chmod(dir, 0o000); err != nil {
		t.Fatalf("chmod: %v", err)
	}
	t.Cleanup(func() { _ = os.Chmod(dir, 0o700) })

	_, err := NewManager(filepath.Join(dir, "state.json"))
	if err == nil {
		t.Fatal("expected permission error, got nil")
	}
}

func TestAddRemoveCluster(t *testing.T) {
	path := filepath.Join(t.TempDir(), "state.json")
	m, err := NewManager(path)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}
	if err := m.AddCluster(ClusterConfig{ID: "c1", Name: "one", Endpoint: "http://e"}); err != nil {
		t.Fatalf("AddCluster: %v", err)
	}
	if _, ok := m.GetCluster("c1"); !ok {
		t.Fatal("cluster c1 not found")
	}
	if err := m.RemoveCluster("c1"); err != nil {
		t.Fatalf("RemoveCluster: %v", err)
	}
	if _, ok := m.GetCluster("c1"); ok {
		t.Fatal("cluster c1 still present after remove")
	}
}

func TestValidateClusterEndpointsRejectsUnsafeTargets(t *testing.T) {
	for _, endpoint := range []string{
		"file:///etc/passwd", "http://user:pass@example.com", "http://127.0.0.1:3900", "http://169.254.169.254/latest",
	} {
		if err := ValidateClusterEndpoints(endpoint); err == nil {
			t.Errorf("ValidateClusterEndpoints(%q) accepted unsafe endpoint", endpoint)
		}
	}
}

func TestSetupAdminIsSingleUse(t *testing.T) {
	m, err := NewManager(filepath.Join(t.TempDir(), "state.json"))
	if err != nil {
		t.Fatal(err)
	}
	admin := AdminAccount{Nickname: "admin", Password: "hash", Setup: true}
	if ok, err := m.SetupAdmin(admin); err != nil || !ok {
		t.Fatalf("first setup = %v, %v", ok, err)
	}
	if ok, err := m.SetupAdmin(admin); err != nil || ok {
		t.Fatalf("second setup = %v, %v", ok, err)
	}
}
