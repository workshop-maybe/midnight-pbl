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
  gcloud config set project "$GCP_PROJECT_ID"
  ```

The commands below use shell variables for the GCP target. Set these first (or substitute your own values inline):

```bash
export GCP_PROJECT_ID="your-gcp-project"
export GCP_REGION="us-central1"
export GCP_SERVICE="your-service-name"        # e.g. "midnight-pbl"
export GCP_REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/your-repo"
```

For the GitHub Actions deploy, set the same four values as repository variables in **Settings → Secrets and variables → Actions → Variables** (`GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE`, `GCP_REGISTRY`). The workflow in `.github/workflows/deploy.yml` reads them at build time.

You also need three repository secrets under **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Description |
|--------|-------------|
| `ANDAMIO_API_KEY` | Andamio API key. Passed as a Docker build arg and a Cloud Run env var. |
| `WIF_PROVIDER` | Full resource name of the Workload Identity Federation provider (e.g. `projects/123/locations/global/workloadIdentityPools/github/providers/github`). |
| `WIF_SERVICE_ACCOUNT` | Email of the GCP service account WIF impersonates (e.g. `deploy@your-project.iam.gserviceaccount.com`). The account needs `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser`. |

See [Google's Workload Identity Federation guide](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation) for creating the provider and service account.

## Option A: GCP Cloud Run (Recommended)

### 1. Build and push the Docker image

```bash
# Authenticate with GCP
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev"

# Build the image
docker build \
  --platform linux/amd64 \
  --build-arg ANDAMIO_API_KEY=<key> \
  --build-arg PUBLIC_ANDAMIO_NETWORK=preprod \
  -t "${GCP_REGISTRY}/${GCP_SERVICE}:latest" \
  .

# Push to Artifact Registry
docker push "${GCP_REGISTRY}/${GCP_SERVICE}:latest"
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy "$GCP_SERVICE" \
  --image "${GCP_REGISTRY}/${GCP_SERVICE}:latest" \
  --region "$GCP_REGION" \
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
  --service "$GCP_SERVICE" \
  --domain your-domain.example.com \
  --region "$GCP_REGION"
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
