package state

import (
	"encoding/json"
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

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			m.state = State{
				Clusters: []ClusterConfig{},
			}
			return m, m.Save()
		}
		return nil, err
	}

	if err := json.Unmarshal(data, &m.state); err != nil {
		return nil, err
	}

	return m, nil
}

func (m *Manager) Save() error {
	data, err := json.MarshalIndent(m.state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(m.path, data, 0600)
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
