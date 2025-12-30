# Automatic Deployment Setup

This project is configured for automatic deployment using **Render** with GitHub integration.

## How It Works

Every push to GitHub triggers an automatic deployment:

1. **Push to `main` branch** → Production deployment
2. **Pull Request** → Preview deployment (via GitHub Actions)

## Quick Setup (One-Time)

### Step 1: Connect to Render

1. Go to [render.com](https://render.com) and sign up/login with GitHub
2. Click **"New +"** → **"Blueprint"**
3. Select this repository
4. Render will automatically detect `render.yaml` and create:
   - A web service for your app
   - A PostgreSQL database (free tier)

### Step 2: Configure GitHub Secrets (Optional - for PR previews)

In your GitHub repo settings → Secrets and variables → Actions, add:

| Secret | Description |
|--------|-------------|
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook URL from Render dashboard |
| `RENDER_API_KEY` | API key from Render account settings |
| `RENDER_SERVICE_ID` | Service ID from your Render service URL |
| `RENDER_SERVICE_URL` | Your Render app URL (e.g., `https://vault-app.onrender.com`) |

### Step 3: Done!

Every push to GitHub now automatically:
- Runs type checking
- Builds the application
- Deploys to Render
- Comments on PRs with preview links

## Environment Variables

Required environment variables (set in Render dashboard):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Render) |
| `NODE_ENV` | Set to `production` |
| `ANTHROPIC_API_KEY` | (Optional) For AI URL analysis feature |

## Deployment URLs

After setup, you'll have:

- **Production**: `https://vault-app.onrender.com` (or your custom domain)
- **Health Check**: `https://vault-app.onrender.com/api/health`

## Manual Deployment

If needed, you can manually trigger a deployment:

```bash
# Build and test locally
npm run build

# Or trigger via Render dashboard
```

## Free Tier Notes

Render's free tier:
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month of runtime
- PostgreSQL free database with 1GB storage

For always-on deployments, upgrade to Render's paid tier.

## Troubleshooting

### Build Fails
- Check GitHub Actions logs for errors
- Ensure `npm run check` passes locally
- Verify all environment variables are set

### Database Issues
- Run `npm run db:push` to sync schema
- Check DATABASE_URL is correctly set

### App Not Starting
- Check Render logs in dashboard
- Verify health check at `/api/health`
