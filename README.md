# Garage UI

A modern, full-stack web interface for managing [Garage](https://garagehq.deuxfleurs.fr/) distributed object storage systems. Built with React, TypeScript, Go, and Fiber for production-ready S3-compatible storage management.

[![Docker Build](https://github.com/Noooste/garage-ui/actions/workflows/build.yml/badge.svg)](https://github.com/Noooste/garage-ui/actions/workflows/build.yml)
[![Helm Chart](https://github.com/Noooste/garage-ui/actions/workflows/release.yml/badge.svg)](https://github.com/Noooste/garage-ui/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go)](https://go.dev/)
[![Node Version](https://img.shields.io/badge/Node-25%2B-339933?logo=node.js)](https://nodejs.org/)
[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/garage-ui)](https://artifacthub.io/packages/search?repo=garage-ui)

Garage UI provides a comprehensive dashboard for managing your Garage S3 storage cluster, featuring bucket management, object operations, user access control, and real-time cluster monitoring—all through an intuitive web interface.

---

## Features

- **Bucket Management** - Create, configure, and delete S3 buckets with visual controls
- **Object Operations** - Upload, download, and manage objects with drag-and-drop support
- **User & Access Control** - Manage access keys, permissions, and user credentials
- **Cluster Monitoring** - Real-time cluster health metrics, node status, and performance statistics
- **Multi-Auth Support** - Flexible authentication with None, Basic Auth, and OIDC/OAuth2 modes
- **Modern UI/UX** - Responsive React interface with dark mode, built on Tailwind CSS and shadcn/ui
- **Production Ready** - Docker/Kubernetes deployment, health checks, and Prometheus metrics
- **API-First Design** - RESTful API with Swagger/OpenAPI documentation

---

## Quick Start

### Prerequisites

- **Garage S3** storage cluster running (v2.0.0+)
- **Docker** & Docker Compose (recommended) OR
- **Go** 1.25+ and **Node.js** 25+ (for development)

### Using Docker Compose (Recommended)

1. **Clone the repository:**

```bash
git clone https://github.com/Noooste/garage-ui.git
cd garage-ui
```

2. **Configure the application:**

```bash
cp config.yaml.example config.yaml
# Edit config.yaml with your Garage endpoints and credentials
```

3. **Start the services:**

```bash
docker-compose up -d
```

4. **Access the UI:**

Open your browser to [http://localhost:8080](http://localhost:8080)

> The Docker Compose setup includes both Garage and Garage UI services for quick local development.

### Using Docker

```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -e GARAGE_UI_GARAGE_ENDPOINT=http://your-garage:3900 \
  -e GARAGE_UI_GARAGE_ADMIN_ENDPOINT=http://your-garage:3903 \
  noooste/garage-ui:latest
```

---

## Installation

### Docker Deployment

**Pull the latest image:**

```bash
docker pull noooste/garage-ui:latest
```

**Available tags:**
- `latest` - Latest stable release
- `v0.0.4` - Specific version
- `0.0` - Minor version track

The Docker image is multi-platform, supporting `linux/amd64` and `linux/arm64`.

### Kubernetes Deployment with Helm

```bash
# Add the Helm repository (if available)
helm repo add garage-ui https://helm.noste.dev/

# Install the chart
helm install garage-ui garage-ui/garage-ui \
  --set garage.endpoint=http://garage:3900 \
  --set garage.adminEndpoint=http://garage:3903 \
  --set garage.adminToken=your-admin-token
```

Or use the local Helm chart:

```bash
helm install garage-ui ./helm/garage-ui -f custom-values.yaml
```

### Building from Source

**Backend:**

```bash
cd backend
go mod download
swag init  # Generate API docs
go build -o garage-ui .
```

**Frontend:**

```bash
cd frontend
npm install
npm run build
```

**Run:**

```bash
# From project root
./backend/garage-ui --config config.yaml
```

---

## Configuration

Garage UI can be configured via YAML file or environment variables.

### Configuration File

Create a `config.yaml` based on the provided example:

```yaml
# Server configuration
server:
  host: "0.0.0.0"
  port: 8080
  environment: "production"

# Garage S3 Configuration
garage:
  endpoint: "http://garage:3900"
  region: "eu-west-1"
  admin_endpoint: "http://garage:3903"
  admin_token: "your-admin-token-here"

# Authentication (none, basic, oidc)
auth:
  mode: "none"

  # Basic auth example
  basic:
    username: "admin"
    password: "secure-password"

  # OIDC example (Keycloak, Auth0, etc.)
  oidc:
    enabled: true
    provider_name: "Keycloak"
    client_id: "garage-ui"
    client_secret: "your-client-secret"
    issuer_url: "https://auth.example.com/realms/master"
    auth_url: "https://auth.example.com/realms/master/protocol/openid-connect/auth"
    token_url: "https://auth.example.com/realms/master/protocol/openid-connect/token"
```

See [`config.yaml.example`](config.yaml.example) for all available options.

### Environment Variables

All configuration can be set via environment variables with the prefix `GARAGE_UI_`:

```bash
GARAGE_UI_SERVER_PORT=8080
GARAGE_UI_GARAGE_ENDPOINT=http://garage:3900
GARAGE_UI_GARAGE_ADMIN_ENDPOINT=http://garage:3903
GARAGE_UI_GARAGE_ADMIN_TOKEN=your-token
GARAGE_UI_AUTH_MODE=basic
GARAGE_UI_AUTH_BASIC_USERNAME=admin
GARAGE_UI_AUTH_BASIC_PASSWORD=password
GARAGE_UI_LOGGING_LEVEL=info
```

**Configuration Priority:** Environment variables override YAML file settings.

---

## Project Structure

```
garage-ui/
├── backend/                  # Go backend (Fiber framework)
│   ├── internal/
│   │   ├── auth/            # Authentication services (JWT, OIDC)
│   │   ├── config/          # Configuration loading
│   │   ├── handlers/        # HTTP request handlers
│   │   ├── middleware/      # CORS, auth middleware
│   │   ├── models/          # Data models and types
│   │   ├── routes/          # API route definitions
│   │   └── services/        # Business logic (S3, Garage Admin)
│   ├── pkg/                 # Shared packages
│   ├── main.go              # Application entry point
│   └── go.mod               # Go dependencies
│
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── buckets/     # Bucket-specific components
│   │   │   ├── charts/      # Data visualization
│   │   │   ├── layout/      # App layout and navigation
│   │   │   └── ui/          # shadcn/ui component library
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client and utilities
│   │   ├── pages/           # Page components (Dashboard, Buckets, etc.)
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx          # Main application component
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite build configuration
│
├── helm/                     # Kubernetes Helm chart
│   └── garage-ui/
│       ├── Chart.yaml       # Chart metadata
│       ├── values.yaml      # Default values
│       └── templates/       # K8s resource templates
│
├── .github/workflows/        # CI/CD pipelines
│   ├── build.yml           # Docker build and push
│   └── release.yml         # Helm chart releases
│
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Local development stack
└── config.yaml.example      # Configuration template
```

**Key Directories:**

- **`backend/internal/handlers/`** - REST API endpoints for buckets, objects, users, cluster, and monitoring
- **`frontend/src/pages/`** - Main application views (Dashboard, Buckets, Cluster, Access Control)
- **`backend/internal/services/`** - Core business logic interfacing with Garage Admin API and S3
- **`frontend/src/lib/api.ts`** - Axios-based API client with automatic error handling

---

## Development

### Local Development Setup

**1. Start Garage (using Docker Compose):**

```bash
docker-compose up garage -d
```

**2. Run the backend:**

```bash
cd backend
go run main.go --config ../config.yaml
```

The backend will start on `http://localhost:8080` with hot-reload (use [air](https://github.com/cosmtrek/air) for auto-reload).

**3. Run the frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts on `http://localhost:3000` with API proxy to backend.

### Available Scripts

**Backend:**

```bash
go run main.go              # Start server
go test ./...               # Run tests
swag init                   # Regenerate API docs
go build -o garage-ui .     # Build binary
```

**Frontend:**

```bash
npm run dev                 # Development server (Vite)
npm run build               # Production build
npm run lint                # ESLint checks
npm run preview             # Preview production build
```

### Testing

```bash
# Backend tests
cd backend && go test ./internal/...

# Frontend tests (if available)
cd frontend && npm test
```

### Building Docker Image

```bash
docker build -t garage-ui:dev .
```

The Dockerfile uses a multi-stage build:
1. **Frontend build** - Node.js Alpine to compile React app
2. **Backend build** - Go Alpine to compile binary
3. **Runtime** - Minimal Alpine with ca-certificates

---

## API Documentation

Once the backend is running, access the Swagger UI documentation at:

**http://localhost:8080/api/v1/**

### API Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/v1/buckets` | GET | List all buckets |
| `/api/v1/buckets` | POST | Create a new bucket |
| `/api/v1/buckets/{name}` | GET | Get bucket details |
| `/api/v1/buckets/{name}` | DELETE | Delete a bucket |
| `/api/v1/buckets/{name}/objects` | GET | List objects in bucket |
| `/api/v1/objects/upload` | POST | Upload object to bucket |
| `/api/v1/objects/download` | GET | Download object |
| `/api/v1/objects/delete` | DELETE | Delete object |
| `/api/v1/users` | GET | List access keys |
| `/api/v1/users` | POST | Create access key |
| `/api/v1/users/{id}` | DELETE | Delete access key |
| `/api/v1/cluster/status` | GET | Cluster node status |
| `/api/v1/cluster/health` | GET | Cluster health metrics |
| `/api/v1/cluster/statistics` | GET | Storage statistics |
| `/api/v1/metrics` | GET | Prometheus metrics |

**Authentication:** Bearer token in `Authorization` header when using OIDC or session-based auth.

---

## Authentication Modes

Garage UI supports three authentication modes:

### 1. None (Default)

No authentication required - suitable for private networks or development.

```yaml
auth:
  mode: "none"
```

### 2. Basic Authentication

Simple username/password authentication.

```yaml
auth:
  mode: "basic"
  basic:
    username: "admin"
    password: "your-secure-password"
```

### 3. OIDC (OpenID Connect)

Enterprise-grade authentication with providers like Keycloak, Auth0, Okta, etc.

```yaml
auth:
  mode: "oidc"
  oidc:
    enabled: true
    provider_name: "Keycloak"
    client_id: "garage-ui"
    client_secret: "your-client-secret"
    issuer_url: "https://auth.example.com/realms/master"
    auth_url: "https://auth.example.com/realms/master/protocol/openid-connect/auth"
    token_url: "https://auth.example.com/realms/master/protocol/openid-connect/token"
    userinfo_url: "https://auth.example.com/realms/master/protocol/openid-connect/userinfo"
    session_max_age: 86400  # 24 hours
    cookie_secure: true      # Enable in production with HTTPS
```

**Role-Based Access (Optional):**

```yaml
auth:
  oidc:
    role_attribute_path: "resource_access.garage-ui.roles"
    admin_role: "admin"
```

---

## Deployment Best Practices

### Production Considerations

1. **Use HTTPS** - Always enable TLS in production:
   ```yaml
   auth:
     oidc:
       cookie_secure: true
   ```

2. **Set Strong Admin Token** - Generate a secure token for Garage Admin API:
   ```bash
   openssl rand -base64 32
   ```

3. **Configure CORS** - Restrict allowed origins:
   ```yaml
   cors:
     allowed_origins:
       - "https://garage-ui.yourdomain.com"
   ```

4. **Enable Monitoring** - Expose metrics endpoint for Prometheus:
   ```yaml
   # Metrics available at /api/v1/metrics
   ```

5. **Resource Limits** - Set appropriate CPU/memory limits in Kubernetes/Docker

### Health Checks

The application provides a health check endpoint:

```bash
curl http://localhost:8080/health
# Response: {"status":"ok","version":"0.1.0"}
```

Docker health check is configured automatically (every 30s).

### Kubernetes Deployment

The Helm chart includes:

- **Deployment** with configurable replicas
- **Service** (ClusterIP/LoadBalancer)
- **Ingress** with TLS support
- **ConfigMap** for configuration
- **NetworkPolicy** for security
- **ServiceMonitor** for Prometheus (optional)

Example custom values:

```yaml
# custom-values.yaml
replicaCount: 2

image:
  repository: noooste/garage-ui
  tag: v0.0.4

garage:
  endpoint: "http://garage.storage.svc.cluster.local:3900"
  adminEndpoint: "http://garage.storage.svc.cluster.local:3903"
  adminToken: "your-secure-token"

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: garage-ui.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: garage-ui-tls
      hosts:
        - garage-ui.example.com

auth:
  mode: oidc
  oidc:
    clientId: garage-ui
    clientSecret: secret
    issuerUrl: https://auth.example.com/realms/master
```

Install with:

```bash
helm install garage-ui ./helm/garage-ui -f custom-values.yaml
```

---

## Technology Stack

### Backend

- **[Go](https://go.dev/)** 1.25+ - High-performance backend runtime
- **[Fiber v3](https://gofiber.io/)** - Express-inspired web framework
- **[Viper](https://github.com/spf13/viper)** - Configuration management
- **[Minio Go SDK](https://github.com/minio/minio-go)** - S3 client library
- **[go-oidc](https://github.com/coreos/go-oidc)** - OpenID Connect support
- **[Zerolog](https://github.com/rs/zerolog)** - Structured logging
- **[Swagger/Swag](https://github.com/swaggo/swag)** - API documentation

### Frontend

- **[React](https://react.dev/)** 19 - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** 5.9+ - Type safety
- **[Vite](https://vitejs.dev/)** 7 - Build tool and dev server
- **[React Router](https://reactrouter.com/)** 7 - Client-side routing
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Zustand](https://github.com/pmndrs/zustand)** - Client state management
- **[React Hook Form](https://react-hook-form.com/)** + [Zod](https://zod.dev/) - Form validation
- **[Tailwind CSS](https://tailwindcss.com/)** 4 - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Lucide Icons](https://lucide.dev/)** - Icon library
- **[Recharts](https://recharts.org/)** - Data visualization
- **[Axios](https://axios-http.com/)** - HTTP client

---

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or code contributions, your input helps improve Garage UI.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (use `gofmt` for Go, ESLint for TypeScript)
- Add tests for new features when possible
- Update documentation for API changes
- Keep commits atomic and descriptive
- Ensure all tests pass before submitting PR

### Reporting Issues

Please open an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Docker version, etc.)

---

## Troubleshooting

### Common Issues

**Issue: "Failed to connect to Garage Admin API"**

- **Solution:** Verify `garage.admin_endpoint` and `garage.admin_token` in config.yaml
- Check Garage Admin API is accessible: `curl http://garage:3903/status -H "Authorization: Bearer your-token"`

**Issue: "CORS errors in browser console"**

- **Solution:** Configure CORS in config.yaml to allow frontend origin:
  ```yaml
  cors:
    allowed_origins:
      - "http://localhost:3000"  # For dev
  ```

**Issue: "401 Unauthorized with OIDC"**

- **Solution:** Verify OIDC configuration, especially `issuer_url`, `client_id`, and `client_secret`
- Check provider configuration allows the redirect URL: `http://your-app/auth/callback`

**Issue: "Objects not appearing after upload"**

- **Solution:** Check S3 endpoint connectivity and bucket permissions
- Verify Garage bucket exists: `garage bucket list`

### Debug Mode

Enable debug logging for troubleshooting:

```yaml
logging:
  level: "debug"
  format: "json"
```

Or via environment variable:

```bash
GARAGE_UI_LOGGING_LEVEL=debug
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Noste

---

## Acknowledgments

- [Garage](https://garagehq.deuxfleurs.fr/) - The lightweight, geo-distributed S3 storage system
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible React components
- [Fiber](https://gofiber.io/) - Fast and lightweight Go web framework
- All open-source contributors who made this project possible

---

## Support

- **Documentation:** [GitHub Wiki](https://github.com/Noooste/garage-ui/wiki) (coming soon)
- **Issues:** [GitHub Issues](https://github.com/Noooste/garage-ui/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Noooste/garage-ui/discussions)

---

**Made with ❤️ for the Garage community**
