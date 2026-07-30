package state

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type AdminAccount struct {
	Nickname string `json:"nickname"`
	Password string `json:"password"` // bcrypt hash, empty if no password set yet
	Setup    bool   `json:"setup"`
}

type ClusterConfig struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Endpoint       string `json:"endpoint"`
	Region         string `json:"region"`
	UseSSL         bool   `json:"use_ssl"`
	ForcePathStyle bool   `json:"force_path_style"`
	AdminEndpoint  string `json:"admin_endpoint"`
	AdminToken     string `json:"admin_token"`
}

type State struct {
	Admin    AdminAccount    `json:"admin"`
	Clusters []ClusterConfig `json:"clusters"`
}

type Manager struct {
	path  string
	state State
	mu    sync.RWMutex
}

func NewManager(path string) (*Manager, error) {
	m := &Manager{path: path}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create state directory %q: %w", dir, err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			m.state = State{
				Clusters: []ClusterConfig{},
			}
			if err := m.Save(); err != nil {
				return nil, err
			}
			return m, nil
		}
		return nil, fmt.Errorf("read state file %q: %w", path, err)
	}

	if err := json.Unmarshal(data, &m.state); err != nil {
		return nil, fmt.Errorf("parse state file %q: %w", path, err)
	}

	return m, nil
}

func (m *Manager) Save() error {
	data, err := json.MarshalIndent(m.state, "", "  ")
	if err != nil {
		return err
	}
	// Write via temp + rename so a crash mid-write cannot leave a truncated file.
	dir := filepath.Dir(m.path)
	tmp, err := os.CreateTemp(dir, "state-*.json.tmp")
	if err != nil {
		return fmt.Errorf("create temp state file in %q: %w", dir, err)
	}
	tmpName := tmp.Name()
	cleanup := true
	defer func() {
		if cleanup {
			_ = os.Remove(tmpName)
		}
	}()
	if err := tmp.Chmod(0600); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("chmod temp state file: %w", err)
	}
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		return fmt.Errorf("write temp state file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temp state file: %w", err)
	}
	if err := os.Rename(tmpName, m.path); err != nil {
		return fmt.Errorf("replace state file %q: %w", m.path, err)
	}
	cleanup = false
	return nil
}

func (m *Manager) GetState() State {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.state
}

func (m *Manager) UpdateAdmin(admin AdminAccount) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.state.Admin = admin
	return m.Save()
}

func (m *Manager) AddCluster(c ClusterConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.state.Clusters = append(m.state.Clusters, c)
	return m.Save()
}

func (m *Manager) RemoveCluster(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	newClusters := make([]ClusterConfig, 0, len(m.state.Clusters))
	for _, c := range m.state.Clusters {
		if c.ID != id {
			newClusters = append(newClusters, c)
		}
	}
	m.state.Clusters = newClusters
	return m.Save()
}

func (m *Manager) UpdateCluster(c ClusterConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, existing := range m.state.Clusters {
		if existing.ID == c.ID {
			m.state.Clusters[i] = c
			return m.Save()
		}
	}
	return nil
}

func (m *Manager) GetCluster(id string) (ClusterConfig, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, c := range m.state.Clusters {
		if c.ID == id {
			return c, true
		}
	}
	return ClusterConfig{}, false
}
