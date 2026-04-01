# Deploying Midnight PBL

The app runs as a standard Node.js server via `react-router-serve`. The included Dockerfile packages everything needed.

## Environment Variables

| Variable | Required | Server/Client | Description |
|----------|----------|---------------|-------------|
| `ANDAMIO_API_KEY` | Yes | Server | Andamio API key (never exposed to browser) |
| `ANDAMIO_GATEWAY_URL` | Yes | Server | Gateway URL, e.g. `https://preprod.api.andamio.io` |
| `CARDANO_NETWORK` | No | Server | `preprod` (default), `mainnet`, or `preview` |
| `COURSE_ID` | No | Server | Course ID for single-course deployment |
| `VITE_ACCESS_TOKEN_POLICY_ID` | No | Client | Policy ID for wallet auth (baked into client bundle at build time) |

**Note:** `VITE_ACCESS_TOKEN_POLICY_ID` is embedded in the client bundle during `npm run build`. It must be set at build time, not just at runtime. All other variables are read at runtime.

## Prerequisites

- **Docker** installed and running
- **Node.js 20+** (for non-Docker builds)
- **GCP CLI** (`gcloud`) installed and authenticated (Cloud Run only):
  ```bash
  gcloud auth login
  gcloud config set project <PROJECT_ID>
  ```

## Option A: GCP Cloud Run (Recommended)

This fits the existing Andamio infrastructure.

### 1. Build and push the Docker image

```bash
# Authenticate with GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build the image (set VITE_ vars at build time)
docker build \
  --build-arg VITE_ACCESS_TOKEN_POLICY_ID=<policy-id> \
  -t us-central1-docker.pkg.dev/<PROJECT_ID>/andamio/midnight-pbl:latest \
  .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/<PROJECT_ID>/andamio/midnight-pbl:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy midnight-pbl \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/andamio/midnight-pbl:latest \
  --region us-central1 \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars "ANDAMIO_API_KEY=<key>,ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io,CARDANO_NETWORK=preprod"
```

### 3. Map a custom domain (optional)

```bash
gcloud run domain-mappings create \
  --service midnight-pbl \
  --domain midnight.andamio.io \
  --region us-central1
```

Follow the DNS instructions GCP provides (CNAME to `ghs.googlehosted.com`).

## Option B: Any Docker Host

Works on any machine or service that runs containers (fly.io, Railway, a VPS, etc.).

### 1. Build

```bash
docker build \
  --build-arg VITE_ACCESS_TOKEN_POLICY_ID=<policy-id> \
  -t midnight-pbl .
```

### 2. Run

```bash
docker run -d \
  -p 3000:3000 \
  -e ANDAMIO_API_KEY=<key> \
  -e ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io \
  -e CARDANO_NETWORK=preprod \
  midnight-pbl
```

The app is now running on port 3000. Put nginx, Caddy, or a cloud load balancer in front for HTTPS.

## Option C: Without Docker

### 1. Install dependencies and build

```bash
npm ci
VITE_ACCESS_TOKEN_POLICY_ID=<policy-id> npm run build
```

### 2. Start the server

```bash
ANDAMIO_API_KEY=<key> \
ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io \
CARDANO_NETWORK=preprod \
npm run start
```

This runs `react-router-serve ./build/server/index.js` on port 3000.

Use a process manager like `pm2` or `systemd` to keep it running.

## Build Args vs Runtime Env

The Dockerfile accepts `VITE_ACCESS_TOKEN_POLICY_ID` as a build arg and bakes it into the client bundle during `npm run build`. Pass it with `--build-arg` when building the image.

Server-side variables (`ANDAMIO_API_KEY`, etc.) are read at runtime and do not need build args.

## Verifying the Deploy

```bash
# Health check — should return HTML
curl -s -o /dev/null -w "%{http_code}" https://<your-domain>/

# Check server logs for env validation errors
docker logs <container-id>
```

If the server fails to start, the most common cause is a missing `ANDAMIO_API_KEY` or `ANDAMIO_GATEWAY_URL` — the app validates these at startup and exits with a clear error.
