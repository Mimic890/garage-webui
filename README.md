<p align="center">
  <a href="https://github.com/mimic890/garage-webui"><img src="https://img.shields.io/badge/Garage-WebUI-blue.svg" alt="Garage WebUI" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://go.dev/"><img src="https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go" alt="Go Version" /></a>
</p>

# Garage WebUI 

A modern, fast, and highly customizable web interface to manage your <a href="https://garagehq.deuxfleurs.fr/">Garage</a> object storage clusters. Easily browse buckets, configure cluster settings, manage access keys, and monitor your nodes — all from an intuitive, localized dashboard.

---

## 🌟 Features

- **Centralized Dashboard** - Get a bird's-eye view of your entire Garage S3 infrastructure.
- **Multi-Cluster Support** - Easily switch between multiple Garage clusters right from the top navigation bar.
- **Bucket & Object Management** - Create, configure, and browse buckets. Upload, download, and delete objects natively.
- **Access Control** - Manage S3 access keys and assign granular permissions for different buckets.
- **Dynamic Theming** - Warm (brand), full Catppuccin (Latte / Frappé / Macchiato / Mocha), GitHub, and Kanagawa — with Dark/Light mode where it applies.
- **Internationalization (i18n)** - Interface fully translated into English and Russian.
- **Timezone Awareness** - Configure your timezone for accurate chart metrics and logs.
- **Admin Security** - Secure, password-based local authentication protecting your cluster.

## 🚀 Quick Start (Docker Compose)

The easiest way to run the Garage WebUI is using Docker Compose.

### 1. Clone the repository
```bash
git clone https://github.com/mimic890/garage-webui.git
cd garage-webui
```

### 2. Configure Environment
A default `docker-compose.yml` is provided. You can modify the environment variables directly in this file.

```yaml
services:
  garage-ui:
    build: .
    container_name: garage-ui
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - garage_ui_data:/app/data
    environment:
      - GARAGE_UI_SERVER_HOST=0.0.0.0
      - GARAGE_UI_SERVER_PORT=8080
      - GARAGE_UI_LOGGING_LEVEL=info # Options: debug, info, warn, error
```

### 3. Start the UI
Run the following command to build the image and start the container:

```bash
docker compose up -d --build
```

Access the panel at http://127.0.0.1:8080.

## ⚙️ Configuration Variables

You can configure the application behavior using environment variables. These can be set directly in your `docker-compose.yml` file:

| Environment Variable | Default | Description |
|----------------------|---------|-------------|
| `GARAGE_UI_SERVER_HOST` | `0.0.0.0` | The host interface the web server binds to. Use `0.0.0.0` for all interfaces. |
| `GARAGE_UI_SERVER_PORT` | `8080` | The port the web server listens on. |
| `GARAGE_UI_DATA_DIR` | `data` (`/app/data` in Docker) | Directory for persistent state (`state.json`: admin account + clusters). |
| `GARAGE_UI_LOGGING_LEVEL` | `info` | The severity level of backend logs. Supported values: `trace`, `debug`, `info`, `warn`, `error`. |

### Default Credentials
On the first startup, if no configuration is provided, the application will initialize with default security policies. Be sure to configure your admin password via the UI upon first login or check your console logs.

## 🛠️ Development Setup

If you want to contribute or build from source manually:

**Backend (Go 1.25+):**
```bash
cd backend
go run main.go
```

**Frontend (Node.js 25+):**
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Connecting a Garage Cluster

Once logged into the UI:
1. Navigate to the **Cluster Switcher** on the top bar or go to the **Settings** menu.
2. Click **Add Garage S3**.
3. Provide your Garage Node's S3 Endpoint and Admin Endpoint (e.g., `http://10.0.0.2:3903`).
4. Enter the `admin_token` matching your `garage.toml`.
5. Save and connect!

## 📜 License
MIT - see [LICENSE](LICENSE)

---
<p align="center">Made with ❤️ for the Garage community.</p>