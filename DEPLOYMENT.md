# CI/CD Deployment Setup

This repository includes two CI/CD workflows for deploying the built application to your server:

## Workflows

### 1. `deploy-server.yml` (Docker-based)

- Builds the project using Docker
- Extracts the `dist/` folder from the Docker container
- Deploys to `/var/www/laguntza-fisioterapia/` on your server

### 2. `deploy-server-optimized.yml` (Direct build - Recommended)

- Builds the project directly using Node.js and pnpm (faster)
- Separates build and deployment jobs
- Includes health checks and deployment verification

## Required GitHub Secrets

To use these workflows, you need to set up the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

### Required Secrets:

- `SERVER_HOST`: Your server's IP address or domain name
- `SERVER_USER`: SSH username for your server (e.g., `ubuntu`, `root`, or your custom user)
- `SERVER_SSH_KEY`: Private SSH key for authentication (see setup below)

### Optional Secrets:

- `SERVER_PORT`: SSH port (defaults to 22 if not specified)

## SSH Key Setup

### 1. Generate SSH Key Pair (if you don't have one)

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@laguntza-fisioterapia"
```

### 2. Add Public Key to Server

Copy the public key (`~/.ssh/id_rsa.pub`) to your server:

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server.com
```

Or manually add it to `~/.ssh/authorized_keys` on your server:

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Add Private Key to GitHub Secrets

Copy the entire private key content (`~/.ssh/id_rsa`) and paste it as the `SERVER_SSH_KEY` secret in GitHub.

## Server Requirements

### Directory Structure

The workflow will create the following directory on your server:

- `/var/www/laguntza-fisioterapia/` - Main deployment directory

### Required Permissions

Your SSH user needs sudo privileges to:

- Create directories in `/var/www/`
- Change ownership to `www-data:www-data`
- Set file permissions

### Web Server Configuration

Make sure your web server (nginx/Apache) is configured to serve files from `/var/www/laguntza-fisioterapia/`.

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/laguntza-fisioterapia;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Deployment Features

### Automatic Backups

Before each deployment, the workflow creates a timestamped backup of the current deployment:

- Format: `/var/www/laguntza-fisioterapia.backup.YYYYMMDD_HHMMSS`

### File Permissions

The workflow automatically sets appropriate permissions:

- Directories: 755
- Files: 644
- Owner: www-data:www-data

### Health Checks

The optimized workflow includes deployment verification to ensure `index.html` exists after deployment.

## Triggering Deployments

Deployments are automatically triggered when:

- Code is pushed to the `master` or `main` branch
- You can also manually trigger deployment using "Run workflow" in the GitHub Actions tab

## Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Verify `SERVER_HOST`, `SERVER_USER`, and `SERVER_SSH_KEY` secrets
   - Test SSH connection manually: `ssh user@server`

2. **Permission Denied**
   - Ensure your SSH user has sudo privileges
   - Check that the SSH key is correctly formatted in the GitHub secret

3. **Files Not Appearing**
   - Check web server configuration
   - Verify file permissions and ownership
   - Check server logs for errors

### Manual Deployment Test

You can test the deployment process manually:

```bash
# Build locally
pnpm install
pnpm run build

# Create archive
tar -czf dist.tar.gz -C dist .

# Upload to server
scp dist.tar.gz user@server:/tmp/

# SSH to server and extract
ssh user@server
sudo tar -xzf /tmp/dist.tar.gz -C /var/www/laguntza-fisioterapia
sudo chown -R www-data:www-data /var/www/laguntza-fisioterapia
```

## Security Notes

- The SSH private key is sensitive information. Never commit it to the repository.
- Consider using a dedicated deployment user with limited privileges instead of root.
- Regularly rotate SSH keys for better security.
- Monitor deployment logs for any suspicious activity.
