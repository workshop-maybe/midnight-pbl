# Deploying Midnight PBL

The app runs as a standalone Node.js server via Astro's Node adapter. The included Dockerfile packages everything needed.

## Environment Variables

| Variable | Required | Context | Description |
|----------|----------|---------|-------------|
| `ANDAMIO_API_KEY` | Yes | Server (secret) | Andamio API key (never exposed to client) |
| `ANDAMIO_GATEWAY_URL` | Yes | Server | Gateway URL, e.g. `https://preprod.api.andamio.io` |
| `CARDANO_NETWORK` | No | Server | `preprod` (default), `mainnet`, or `preview` |
| `COURSE_ID` | No | Server | Course ID for single-course deployment |
| `PUBLIC_ACCESS_TOKEN_POLICY_ID` | No | Client | Policy ID for wallet auth |
| `PUBLIC_GATEWAY_URL` | No | Client | Gateway URL exposed to client islands |
| `PUBLIC_CARDANO_NETWORK` | No | Client | Network name exposed to client islands |

**Note:** Server variables are read at runtime from `process.env`. Client `PUBLIC_*` variables are embedded in the client bundle at build time. `ANDAMIO_GATEWAY_URL` and `COURSE_ID` are inlined at build time for server routes but `ANDAMIO_API_KEY` (secret) is always read at runtime.

## Prerequisites

- **Docker** installed and running
- **Node.js 22+** (for non-Docker builds)
- **GCP CLI** (`gcloud`) installed and authenticated (Cloud Run only):
  ```bash
  gcloud auth login
  gcloud config set project built-on-andamio
  ```

## Option A: GCP Cloud Run (Recommended)

### 1. Build and push the Docker image

```bash
# Authenticate with GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build the image
docker build \
  --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/built-on-andamio/andamio-apps/midnight-pbl:latest \
  .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/built-on-andamio/andamio-apps/midnight-pbl:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy midnight-pbl \
  --image us-central1-docker.pkg.dev/built-on-andamio/andamio-apps/midnight-pbl:latest \
  --region us-central1 \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --memory 1Gi \
  --update-env-vars ANDAMIO_API_KEY=<key> \
  --update-env-vars ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io \
  --update-env-vars CARDANO_NETWORK=preprod \
  --update-env-vars COURSE_ID=<course-id>
```

### 3. Map a custom domain (optional)

```bash
gcloud run domain-mappings create \
  --service midnight-pbl \
  --domain midnight.andamio.io \
  --region us-central1
```

## Option B: Any Docker Host

### 1. Build

```bash
docker build --platform linux/amd64 -t midnight-pbl .
```

### 2. Run

```bash
docker run -d \
  -p 3000:3000 \
  -e ANDAMIO_API_KEY=<key> \
  -e ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io \
  -e CARDANO_NETWORK=preprod \
  -e COURSE_ID=<course-id> \
  midnight-pbl
```

## Option C: Without Docker

### 1. Install and build

```bash
npm ci
npm run build
```

### 2. Start the server

```bash
ANDAMIO_API_KEY=<key> \
ANDAMIO_GATEWAY_URL=https://preprod.api.andamio.io \
CARDANO_NETWORK=preprod \
COURSE_ID=<course-id> \
node ./dist/server/entry.mjs
```

The server runs on port 3000 by default (`HOST=0.0.0.0` is set in Dockerfile).

## Verifying the Deploy

```bash
# Health check
curl -s -o /dev/null -w "%{http_code}" https://<your-domain>/

# Check server logs
docker logs <container-id>
```

If the server fails to start, the most common cause is a missing `ANDAMIO_API_KEY` — Astro validates env vars and exits with a clear error.
