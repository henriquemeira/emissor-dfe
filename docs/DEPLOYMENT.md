# Deployment Guide - Render.com

This guide walks you through deploying the Emissor DFe API to Render.com.

## Prerequisites

- GitHub account with repository access
- Render.com account (free tier available)
- Git repository pushed to GitHub

## Step-by-Step Deployment

### 1. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2. Create a New Web Service

1. Click **"New +"** button in the top right
2. Select **"Web Service"**
3. Connect your GitHub repository (`henriquemeira/emissor-dfe`)
4. Click **"Connect"**

### 3. Configure the Service

Fill in the following settings:

#### Basic Configuration
- **Name**: `emissor-dfe-api` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Ohio for Brazil)
- **Branch**: `main` (or your production branch)
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Instance Type
- **Free**: Good for testing and development
- **Starter ($7/month)**: Recommended for production
  - Better performance
  - No sleep time
  - Custom domains

### 4. Environment Variables

Click **"Advanced"** and add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `ENCRYPTION_KEY` | `[Generate random 32+ chars]` | Master encryption key |
| `ALLOWED_ORIGINS` | `https://yourapp.com` | Comma-separated allowed CORS origins |
| `DATA_DIR` | `./data` | Data directory path |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

**IMPORTANT**: For `ENCRYPTION_KEY`, generate a strong random string:

```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying your application
3. Wait for the build to complete (usually 2-3 minutes)
4. Your API will be available at `https://emissor-dfe-api.onrender.com` (or your custom URL)

### 6. Verify Deployment

Test the health endpoint:

```bash
curl https://emissor-dfe-api.onrender.com/health | jq .
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "environment": "production",
  "storage": {
    "writable": true
  }
}
```

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to your service settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

### Health Check Configuration

Render automatically uses the `/health` endpoint for health checks. Configure in service settings:

- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds (default)

### Auto-Deploy on Git Push

By default, Render auto-deploys when you push to your main branch:

1. Push changes to GitHub
2. Render automatically detects changes
3. Builds and deploys new version
4. Zero-downtime deployment

To disable auto-deploy:
1. Go to service settings
2. Uncheck **"Auto-Deploy"**

## Environment-Specific Configuration

### Development Environment
```env
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Staging Environment
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.yourapp.com
```

### Production Environment
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

## Monitoring and Logs

### View Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. View real-time logs
4. Filter by log level or search

### Metrics

Render provides built-in metrics:
- CPU usage
- Memory usage
- Request count
- Response time

Access via the **"Metrics"** tab.

### Alerts (Paid plans)

Configure alerts for:
- High CPU usage
- High memory usage
- Service downtime
- Failed deployments

## Scaling

### Vertical Scaling
Upgrade to a larger instance:
1. Go to service settings
2. Select **"Instance Type"**
3. Choose a larger plan

### Horizontal Scaling (Team/Business plans)
Add more instances:
1. Go to service settings
2. Configure **"Scaling"**
3. Set minimum and maximum instances

## Backup Strategy

### Data Directory Backup

Render's filesystem is ephemeral. For production use, consider:

1. **Periodic Backups**: Create a backup endpoint
2. **Cloud Storage**: Use AWS S3 or Google Cloud Storage
3. **Database Migration**: Consider using PostgreSQL for account data (Phase 2+)

Example backup script (run locally):

```bash
#!/bin/bash
# Download all account data
API_URL="https://emissor-dfe-api.onrender.com"

# This requires implementing a backup endpoint in Phase 2
curl -X GET $API_URL/api/v1/admin/backup \
  -H "X-Admin-Key: your-admin-key" \
  -o backup-$(date +%Y%m%d).zip
```

## Security Considerations

### HTTPS
- ✅ Automatically enabled by Render
- ✅ Free SSL certificates
- ✅ Automatic renewal

### Environment Variables
- ✅ Encrypted at rest
- ✅ Not visible in logs
- ✅ Can be rotated without redeployment

### Network Security
- Consider using Render's IP allow-listing (Team/Business plans)
- Use strong `ENCRYPTION_KEY`
- Rotate API keys periodically

## Troubleshooting

### Deployment Failed

**Check build logs:**
1. Go to service dashboard
2. Click failed deployment
3. Review build logs for errors

**Common issues:**
- Missing dependencies in `package.json`
- Node version mismatch
- Build command errors

**Solution:**
```bash
# Test build locally
npm install
npm start

# Check Node version
node --version  # Should be 18+
```

### Service Won't Start

**Check runtime logs:**
1. View logs in Render dashboard
2. Look for startup errors

**Common issues:**
- Missing environment variables
- Port binding issues
- Configuration errors

**Solution:**
- Verify all required env vars are set
- Don't set PORT (Render sets it automatically)
- Check `ENCRYPTION_KEY` is at least 32 characters

### Health Check Failing

**Check health endpoint:**
```bash
curl https://your-service.onrender.com/health
```

**Common issues:**
- Service not responding
- `/health` endpoint error
- Data directory not writable

**Solution:**
- Check logs for errors
- Verify health endpoint works locally
- Ensure `DATA_DIR` is writable

### Data Not Persisting

**Issue:** Render uses ephemeral filesystem

**Solutions:**
1. **Render Disks** (Paid plans): Persistent storage
2. **Cloud Storage**: AWS S3, Google Cloud Storage
3. **Database**: PostgreSQL for structured data

To add Render Disk:
1. Go to service settings
2. Add **"Disk"**
3. Set mount path (e.g., `/var/data`)
4. Update `DATA_DIR` env var to `/var/data`

## Cost Optimization

### Free Tier Limitations
- Spins down after 15 minutes of inactivity
- 750 hours/month free
- 512 MB RAM
- Shared CPU

**For Production:**
- Use Starter plan ($7/month minimum)
- No sleep time
- Better performance
- Custom domains

### Monitoring Costs

Monitor your usage:
1. Go to account settings
2. Check **"Usage"**
3. Review monthly costs

## Support

### Render Support
- Documentation: [render.com/docs](https://render.com/docs)
- Community: [community.render.com](https://community.render.com)
- Email: [support@render.com](mailto:support@render.com)

### API Issues
- GitHub Issues: [github.com/henriquemeira/emissor-dfe/issues](https://github.com/henriquemeira/emissor-dfe/issues)
- Documentation: Check `README.md` and `docs/API-TESTING.md`

## Next Steps

After successful deployment:

1. ✅ Test all endpoints with production URL
2. ✅ Configure custom domain
3. ✅ Set up monitoring/alerts
4. ✅ Create backup strategy
5. ✅ Document API for your team
6. ✅ Integrate with your frontend application

## Production Checklist

- [ ] Strong random `ENCRYPTION_KEY` configured
- [ ] `NODE_ENV` set to `production`
- [ ] `ALLOWED_ORIGINS` configured for your domain(s)
- [ ] Health check responding correctly
- [ ] All endpoints tested with production URL
- [ ] Custom domain configured (if needed)
- [ ] Monitoring/alerts set up
- [ ] Backup strategy in place
- [ ] Team has access to Render dashboard
- [ ] Documentation shared with team
- [ ] Load testing completed
- [ ] Security review completed

---

**Ready to deploy?** Follow the steps above and your API will be live in minutes! 🚀
