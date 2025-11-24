package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	Server  ServerConfig  `mapstructure:"server"`
	Garage  GarageConfig  `mapstructure:"garage"`
	Auth    AuthConfig    `mapstructure:"auth"`
	CORS    CORSConfig    `mapstructure:"cors"`
	Logging LoggingConfig `mapstructure:"logging"`
}

// ServerConfig contains server-related configuration
type ServerConfig struct {
	Host        string `mapstructure:"host"`
	Port        int    `mapstructure:"port"`
	Environment string `mapstructure:"environment"`
}

// GarageConfig contains Garage S3 connection settings
type GarageConfig struct {
	Endpoint       string `mapstructure:"endpoint"`
	Region         string `mapstructure:"region"`
	AccessKey      string `mapstructure:"access_key"`
	SecretKey      string `mapstructure:"secret_key"`
	UseSSL         bool   `mapstructure:"use_ssl"`
	ForcePathStyle bool   `mapstructure:"force_path_style"`
}

// AuthConfig contains authentication configuration
type AuthConfig struct {
	Mode  string           `mapstructure:"mode"` // "none", "basic", or "oidc"
	Basic BasicAuthConfig  `mapstructure:"basic"`
	OIDC  OIDCConfig       `mapstructure:"oidc"`
}

// BasicAuthConfig contains basic authentication settings
type BasicAuthConfig struct {
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

// OIDCConfig contains OIDC authentication settings
type OIDCConfig struct {
	Enabled          bool     `mapstructure:"enabled"`
	ProviderName     string   `mapstructure:"provider_name"`
	ClientID         string   `mapstructure:"client_id"`
	ClientSecret     string   `mapstructure:"client_secret"`
	Scopes           []string `mapstructure:"scopes"`
	IssuerURL        string   `mapstructure:"issuer_url"`
	AuthURL          string   `mapstructure:"auth_url"`
	TokenURL         string   `mapstructure:"token_url"`
	UserinfoURL      string   `mapstructure:"userinfo_url"`
	SkipIssuerCheck  bool     `mapstructure:"skip_issuer_check"`
	SkipExpiryCheck  bool     `mapstructure:"skip_expiry_check"`
	EmailAttribute   string   `mapstructure:"email_attribute"`
	UsernameAttribute string  `mapstructure:"username_attribute"`
	NameAttribute    string   `mapstructure:"name_attribute"`
	RoleAttributePath string  `mapstructure:"role_attribute_path"`
	AdminRole        string   `mapstructure:"admin_role"`
	TLSSkipVerify    bool     `mapstructure:"tls_skip_verify"`
	SessionMaxAge    int      `mapstructure:"session_max_age"`
	CookieName       string   `mapstructure:"cookie_name"`
	CookieSecure     bool     `mapstructure:"cookie_secure"`
	CookieHTTPOnly   bool     `mapstructure:"cookie_http_only"`
	CookieSameSite   string   `mapstructure:"cookie_same_site"`
}

// CORSConfig contains CORS settings for frontend communication
type CORSConfig struct {
	Enabled          bool     `mapstructure:"enabled"`
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
	MaxAge           int      `mapstructure:"max_age"`
}

// LoggingConfig contains logging configuration
type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load reads the configuration from the specified file
func Load(configPath string) (*Config, error) {
	// Set default config file name if not specified
	if configPath == "" {
		configPath = "config.yaml"
	}

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file not found: %s", configPath)
	}

	// Configure viper to read the config file
	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	// Allow environment variables to override config values
	viper.AutomaticEnv()

	// Read the configuration file
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// Unmarshal the configuration into our Config struct
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate the configuration
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &cfg, nil
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	// Validate server config
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", c.Server.Port)
	}

	// Validate Garage config
	if c.Garage.Endpoint == "" {
		return fmt.Errorf("garage endpoint is required")
	}
	if c.Garage.AccessKey == "" {
		return fmt.Errorf("garage access_key is required")
	}
	if c.Garage.SecretKey == "" {
		return fmt.Errorf("garage secret_key is required")
	}

	// Validate auth mode
	if c.Auth.Mode != "none" && c.Auth.Mode != "basic" && c.Auth.Mode != "oidc" {
		return fmt.Errorf("auth mode must be 'none', 'basic', or 'oidc', got: %s", c.Auth.Mode)
	}

	// Validate basic auth if enabled
	if c.Auth.Mode == "basic" {
		if c.Auth.Basic.Username == "" || c.Auth.Basic.Password == "" {
			return fmt.Errorf("basic auth username and password are required when auth mode is 'basic'")
		}
	}

	// Validate OIDC config if enabled
	if c.Auth.Mode == "oidc" {
		if c.Auth.OIDC.ClientID == "" {
			return fmt.Errorf("oidc client_id is required when auth mode is 'oidc'")
		}
		if c.Auth.OIDC.IssuerURL == "" {
			return fmt.Errorf("oidc issuer_url is required when auth mode is 'oidc'")
		}
		if len(c.Auth.OIDC.Scopes) == 0 {
			return fmt.Errorf("oidc scopes are required when auth mode is 'oidc'")
		}
	}

	return nil
}

// GetAddress returns the full server address (host:port)
func (c *Config) GetAddress() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}
