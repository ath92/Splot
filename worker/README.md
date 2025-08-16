# Splot Hello World Worker

A simple Cloudflare Worker that responds with a "Hello World" message.

## What it does

- Returns a JSON response with greeting message, timestamp, and request details
- Includes CORS headers for web compatibility
- Automatically deployed via GitHub Actions when changes are made to this directory

## Files

- `src/index.js` - The worker code (hello world response)
- `wrangler.toml` - Cloudflare Worker configuration
- `package.json` - Worker dependencies and scripts

## Setup

To deploy this worker, you need to configure GitHub Secrets:

1. **CF_WORKERS** - Your Cloudflare API Token
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Use the "Edit Cloudflare Workers" template
   - Ensure it has permissions: `Zone:Zone Settings:Read`, `Zone:Zone:Read`, `Account:Cloudflare Workers:Edit`

2. **CF_ACCOUNT_ID** - Your Cloudflare Account ID
   - Found in the Cloudflare dashboard right sidebar
   - Or visit: https://dash.cloudflare.com/ and copy the Account ID

## Deployment

The worker is automatically deployed when:
- Changes are pushed to the `main` branch in the `worker/` directory
- Or manually triggered via GitHub Actions

The deployment uses the GitHub secrets for authentication with Cloudflare.