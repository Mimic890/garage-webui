package state

import (
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
