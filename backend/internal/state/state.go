package state

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
)

const CurrentSecurityVersion = 1

type PasskeyCredential struct {
	Credential webauthn.Credential `json:"credential"`
	Name       string              `json:"name"`
	CreatedAt  time.Time           `json:"created_at"`
	LastUsedAt time.Time           `json:"last_used_at,omitempty"`
}

type AdminAccount struct {
	Nickname             string              `json:"nickname"`
	Password             string              `json:"password"` // SHA-256 then bcrypt, empty if no password set yet
	Setup                bool                `json:"setup"`
	Email                string              `json:"email,omitempty"`
	SecurityVersion      int                 `json:"security_version,omitempty"`
	WebAuthnUserHandle   []byte              `json:"webauthn_user_handle,omitempty"`
	TOTPSecret           string              `json:"totp_secret,omitempty"`
	TOTPLastAcceptedStep int64               `json:"totp_last_accepted_timestep,omitempty"`
	RecoveryCodeHashes   []string            `json:"recovery_code_hashes,omitempty"`
	Passkeys             []PasskeyCredential `json:"passkeys,omitempty"`
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
	if m.state.Admin.Setup && (m.state.Admin.SecurityVersion < CurrentSecurityVersion || len(m.state.Admin.WebAuthnUserHandle) != 64) {
		if err := ensureAdminSecurity(&m.state.Admin); err != nil {
			return nil, err
		}
		if err := m.Save(); err != nil {
			return nil, fmt.Errorf("migrate admin security state: %w", err)
		}
	}

	return m, nil
}

func (m *Manager) Save() error {
	m.mu.RLock()
	s := m.state
	m.mu.RUnlock()
	return m.save(s)
}

func (m *Manager) save(s State) error {
	data, err := json.MarshalIndent(s, "", "  ")
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
	if f, err := os.OpenFile(tmpName, os.O_WRONLY, 0600); err == nil {
		if err := f.Sync(); err != nil {
			_ = f.Close()
			return fmt.Errorf("sync temp state file: %w", err)
		}
		if err := f.Close(); err != nil {
			return fmt.Errorf("close synced state file: %w", err)
		}
	} else {
		return fmt.Errorf("reopen temp state file: %w", err)
	}
	if err := os.Rename(tmpName, m.path); err != nil {
		return fmt.Errorf("replace state file %q: %w", m.path, err)
	}
	if dirHandle, err := os.Open(dir); err == nil {
		if err := dirHandle.Sync(); err != nil {
			_ = dirHandle.Close()
			return fmt.Errorf("sync state directory: %w", err)
		}
		if err := dirHandle.Close(); err != nil {
			return fmt.Errorf("close state directory: %w", err)
		}
	} else {
		return fmt.Errorf("open state directory: %w", err)
	}
	cleanup = false
	return nil
}

func (m *Manager) GetState() State {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return cloneState(m.state)
}

func cloneState(s State) State {
	data, _ := json.Marshal(s)
	var clone State
	_ = json.Unmarshal(data, &clone)
	return clone
}

func ensureAdminSecurity(admin *AdminAccount) error {
	if !admin.Setup {
		return nil
	}
	if admin.SecurityVersion < CurrentSecurityVersion {
		admin.SecurityVersion = CurrentSecurityVersion
	}
	if len(admin.WebAuthnUserHandle) != 64 {
		admin.WebAuthnUserHandle = make([]byte, 64)
		if _, err := rand.Read(admin.WebAuthnUserHandle); err != nil {
			return fmt.Errorf("generate WebAuthn user handle: %w", err)
		}
	}
	return nil
}

func (m *Manager) UpdateAdmin(admin AdminAccount) error {
	return m.MutateAdmin(func(current *AdminAccount) error { *current = admin; return nil })
}

// MutateAdmin applies and persists one account change while holding the lock.
// The callback receives a deep copy and failed saves never become visible.
func (m *Manager) MutateAdmin(fn func(*AdminAccount) error) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	candidate := cloneState(m.state)
	if err := fn(&candidate.Admin); err != nil {
		return err
	}
	if err := ensureAdminSecurity(&candidate.Admin); err != nil {
		return err
	}
	if err := m.save(candidate); err != nil {
		return err
	}
	m.state = candidate
	return nil
}

// SetupAdmin atomically claims first-time setup and persists it before making
// the new account visible to other requests.
func (m *Manager) SetupAdmin(admin AdminAccount) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.state.Admin.Setup {
		return false, nil
	}
	if err := ensureAdminSecurity(&admin); err != nil {
		return false, err
	}
	candidate := m.state
	candidate.Admin = admin
	if err := m.save(candidate); err != nil {
		return false, err
	}
	m.state = candidate
	return true, nil
}

func (m *Manager) AddCluster(c ClusterConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	candidate := m.state
	candidate.Clusters = append(append([]ClusterConfig(nil), m.state.Clusters...), c)
	if err := m.save(candidate); err != nil {
		return err
	}
	m.state = candidate
	return nil
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
	candidate := m.state
	candidate.Clusters = newClusters
	if err := m.save(candidate); err != nil {
		return err
	}
	m.state = candidate
	return nil
}

func (m *Manager) UpdateCluster(c ClusterConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, existing := range m.state.Clusters {
		if existing.ID == c.ID {
			candidate := m.state
			candidate.Clusters = append([]ClusterConfig(nil), m.state.Clusters...)
			candidate.Clusters[i] = c
			if err := m.save(candidate); err != nil {
				return err
			}
			m.state = candidate
			return nil
		}
	}
	return nil
}

// ValidateClusterEndpoints rejects control-plane targets that could reach
// local or cloud metadata services. DNS is resolved before persistence so a
// hostname cannot bypass the IP checks.
func ValidateClusterEndpoints(endpoints ...string) error {
	for _, raw := range endpoints {
		u, err := url.Parse(raw)
		if err != nil || u.Scheme != "http" && u.Scheme != "https" || u.User != nil || u.Hostname() == "" || u.Path == "" && u.RawQuery != "" {
			return fmt.Errorf("invalid cluster endpoint")
		}
		if u.Port() != "" {
			if p, err := strconv.Atoi(u.Port()); err != nil || p <= 0 || p > 65535 {
				return fmt.Errorf("invalid cluster endpoint")
			}
		}
		ips, err := net.LookupIP(u.Hostname())
		if err != nil || len(ips) == 0 {
			return fmt.Errorf("cluster endpoint host could not be resolved")
		}
		for _, ip := range ips {
			if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() || ip.IsMulticast() || ip.String() == "169.254.169.254" {
				return fmt.Errorf("cluster endpoint targets a local or metadata address")
			}
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
