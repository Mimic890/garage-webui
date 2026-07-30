FROM --platform=$BUILDPLATFORM node:25-alpine3.23 AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY frontend/ .

RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.26.0-alpine3.23 AS backend-builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go install github.com/swaggo/swag/cmd/swag@latest

COPY backend/go.mod backend/go.sum ./

RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY backend .

ARG VERSION=dev

RUN --mount=type=cache,target=/root/.cache/go-build \
    swag init

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -a -installsuffix cgo -ldflags "-X main.version=${VERSION}" -o garage-ui .

FROM alpine:3.23.3

WORKDIR /app

# su-exec: drop root after fixing volume ownership in the entrypoint
RUN apk --no-cache add ca-certificates wget su-exec

RUN addgroup -g 1000 garageui && \
    adduser -D -u 1000 -G garageui garageui && \
    mkdir -p /app/data && \
    chown -R garageui:garageui /app/data

COPY --from=backend-builder --chown=garageui:garageui /app/garage-ui .
COPY --from=frontend-builder --chown=garageui:garageui /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

# Start as root so the entrypoint can chown mounted volumes, then it drops
# to garageui (uid 1000) before exec'ing the app. If the orchestrator forces
# runAsNonRoot, entrypoint skips chown and relies on fsGroup / pre-fixed perms.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["./garage-ui"]
