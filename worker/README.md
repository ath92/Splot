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

### Authentication Setup

There are two ways to authenticate with Cloudflare:

#### Option 1: API Key (Legacy - Current Setup)
Uses the current workflow file `deploy-worker.yml`.

Required GitHub Secrets:
- `CF_WORKERS` - Your Cloudflare Global API Key
- `CF_EMAIL` - Your Cloudflare account email address

To find your Global API Key:
1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Under "API Keys" section, click "View" next to "Global API Key"

#### Option 2: API Token (Recommended)
Uses the alternative workflow file `deploy-worker-token.yml`.

Required GitHub Secrets:
- `CF_API_TOKEN` - Your Cloudflare API Token

To create an API Token:
1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template or create custom token with:
   - Zone permissions: Zone:Read, Zone:Zone:Read
   - Account permissions: Account:Account:Read
   - Zone Resources: Include:All zones
   - Account Resources: Include:All accounts

### Switching Authentication Methods

To switch from API Key to API Token:
1. Create the `CF_API_TOKEN` secret in your repository
2. Rename `deploy-worker.yml` to `deploy-worker-legacy.yml`
3. Rename `deploy-worker-token.yml` to `deploy-worker.yml`
4. Remove the old `CF_WORKERS` and `CF_EMAIL` secrets if desired

## Troubleshooting

### Authentication Error (Code 10001)
If you see the error "Unable to authenticate request [code: 10001]":

1. **Check your authentication method**: 
   - If using API Key: Ensure both `CF_WORKERS` (Global API Key) and `CF_EMAIL` secrets are set
   - If using API Token: Ensure `CF_API_TOKEN` secret is set and has correct permissions

2. **Verify credentials**:
   - API Key: Must be the Global API Key (not email and password)
   - API Token: Must have "Edit Cloudflare Workers" permissions
   - Email: Must match the account that owns the API Key

3. **Check secret names**: Ensure the secret names in GitHub match what's referenced in the workflow file

4. **Test locally**: Run `wrangler whoami` with your credentials to verify they work

### Common Issues
- **Wrong secret name**: The workflow expects specific secret names
- **API Key without email**: Legacy API Keys require both key and email
- **Insufficient permissions**: API Token must have worker edit permissions
- **Account access**: Ensure the credentials have access to the account/zone