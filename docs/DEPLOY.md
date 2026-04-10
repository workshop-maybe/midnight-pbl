# Deploying Midnight PBL

The app runs as a standalone Node.js server via Astro's Node adapter. The included Dockerfile packages everything needed.

## Environment Variables

| Variable | Required | Context | Description |
|----------|----------|---------|-------------|
| `ANDAMIO_API_KEY` | Yes | Server (secret) | Andamio API key. Runtime-resolved, never exposed to the client. |
| `PUBLIC_ANDAMIO_NETWORK` | No | Client (public) | `preprod` (default) or `mainnet`. Selects a profile from `src/config/networks.ts`. |

That's it. Every other network-dependent value (gateway URL, course ID, access token policy ID, Cardano network name) is resolved at build time from the profile you pick. To flip networks, change one variable.

**Note:** `ANDAMIO_API_KEY` must be present at build time because Astro validates the env schema during `astro build`. `PUBLIC_ANDAMIO_NETWORK` is inlined into both server and client bundles at build time, so a rebuild is required to change networks.

## Switching from preprod to mainnet

1. Fill in `src/config/networks.ts` → `mainnet` entry with the real `accessTokenPolicyId` and `courseId`.
2. Set `PUBLIC_ANDAMIO_NETWORK=mainnet` (in `.env` for local, or the `ANDAMIO_NETWORK` variable in `.github/workflows/deploy.yml`).
3. Rebuild. That's it — the gateway URL, policy ID, course ID, and Cardano network flip together.

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
  --build-arg ANDAMIO_API_KEY=<key> \
  --build-arg PUBLIC_ANDAMIO_NETWORK=preprod \
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
  --update-env-vars PUBLIC_ANDAMIO_NETWORK=preprod
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
docker build \
  --platform linux/amd64 \
  --build-arg ANDAMIO_API_KEY=<key> \
  --build-arg PUBLIC_ANDAMIO_NETWORK=preprod \
  -t midnight-pbl .
```

### 2. Run

```bash
docker run -d \
  -p 3000:3000 \
  -e ANDAMIO_API_KEY=<key> \
  -e PUBLIC_ANDAMIO_NETWORK=preprod \
  midnight-pbl
```

## Option C: Without Docker

### 1. Install and build

```bash
ANDAMIO_API_KEY=<key> \
PUBLIC_ANDAMIO_NETWORK=preprod \
npm ci
ANDAMIO_API_KEY=<key> \
PUBLIC_ANDAMIO_NETWORK=preprod \
npm run build
```

### 2. Start the server

```bash
ANDAMIO_API_KEY=<key> \
PUBLIC_ANDAMIO_NETWORK=preprod \
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
