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

## Deployment

The worker is automatically deployed when:
- Changes are pushed to the `main` branch in the `worker/` directory
- Or manually triggered via GitHub Actions

Uses the `CF_WORKERS` secret for Cloudflare API authentication.