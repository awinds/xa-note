[中文](README.md) | Endlish

# XA Note

XA Note is a **lightweight, fully self-hosted personal note-taking system**, designed for users who prioritize **privacy, security, and full control**. You deploy and manage it entirely on your own infrastructure. It supports Markdown editing, category management, tagging, and full-text search—offering a smooth writing experience and clear knowledge organization.

Author's Blog: [https://www.xiaoa.me](https://www.xiaoa.me)

If you find this project helpful, please give it a `Star` ⭐!

![](screenshot.png)

## 🌟 Core Features

### 🔐 Full Data Ownership
- **Self-hosted deployment**: All data resides solely on your own server
- **No third-party dependencies**: No reliance on external cloud services—complete data sovereignty
- **Privacy-first**: Your data never leaves your control

### 📝 Powerful Note-Taking Capabilities
- **Markdown editor**: Real-time preview with rich syntax support
- **Category management**: Flexible categorization for structured knowledge
- **Tag system**: Multi-dimensional tagging for quick note discovery
- **Full-text search**: Powerful search to instantly locate content
- **Data export**: Export notes as Markdown files to avoid vendor lock-in

### 🛡️ Multi-Layer Security
- **Multiple login options**: Username/password or GitHub OAuth (not supported on Cloudflare Pages)
- **Security verification**: Optional image CAPTCHA or Cloudflare Turnstile protection
- **Screen lock**: Prevent unauthorized access with an inactivity lock
- **Access control**: Ideal for long-term use on personal servers or private networks
- **Audit logging**: Comprehensive operation logs for security auditing

### 🔗 Secure Sharing & Backup
- **Read-only sharing**: Share notes with optional password and expiration time
- **WebDAV backup**: Integrate with cloud storage or private NAS for automatic sync (not supported on Cloudflare Pages)
- **Long-term preservation**: Multiple backup strategies ensure data safety

### 🎨 Excellent User Experience
- **Responsive design**: Works seamlessly on desktop and mobile devices
- **Theme switching**: Toggle between light and dark modes
- **Multi-language support**: Switch effortlessly between Chinese and English
- **Keyboard shortcuts**: Boost productivity with hotkeys
- **System monitoring**: Built-in log management with filtering and viewing capabilities

---

## 🚀 Quick Deployment Guide

### Method 1: Deploy on Cloudflare

#### Step 1: Fork This Repository
Please fork this repo—and don’t forget to give it a `Star`! ⭐

#### Step 2: Create a D1 Database
Manually create a D1 database named: `xa-note-db`

*Or* create via CLI:
```bash
# Create D1 database
wrangler d1 create xa-note-db
```

#### Step 3: Import Database Schema
Manually copy and paste the contents of `d1-init.sql` (*6 tables*) into the D1 console,

*Or* import via CLI:
```bash
# Initialize database with schema and default data
wrangler d1 execute xa-note-db --file=d1-init.sql
```

#### Step 4: Create a Cloudflare Pages Project
1. Go to **Cloudflare Dashboard** > **Pages** > **Create a project**
2. Connect your Git repository
3. Configure **Build Settings**:
   - **Framework preset**: `None`
   - **Build command**: `npm install`
   - **Build output directory**: `.`
   - **Root directory**: `/`
   - **Node.js version**: `18` or higher

#### Step 5: Configure Environment Variables
1. Go to **Cloudflare Dashboard** > **Pages** > **Your Project**
2. Navigate to **Settings** > **Environment variables**
3. Add **Production** variables (optional but recommended):
   - `JWT_SECRET`: Your secure JWT secret (32+ characters)
   - `NODE_ENV`: `production`
4. Go to **Settings** > **Functions**
5. Add **D1 Database Binding**:
   - **Variable name**: `DB`
   - **D1 Database**: `xa-note-db`

#### Step 6: Post-Deployment Setup
1. **Visit your site**: `https://your-project.pages.dev` or your custom domain
2. **Complete setup**: Follow the installation wizard
3. **Start using**: Create your first note!

---

### Method 2: Docker Deployment

#### **One-Command Deployment**
```bash
# Pull the image
docker pull awinds/xa-note:latest

mkdir -p /var/xa-note/data

# Run container
docker run -d \
  --name xa-note \
  -p 9915:9915 \
  -v /var/xa-note/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=9915 \
  --restart unless-stopped \
  awinds/xa-note:latest
```

#### **Docker Compose Deployment**
```yaml
# docker-compose.yml
version: "3.9"

services:
  xa-note:
    image: awinds/xa-note:latest
    container_name: xa-note
    ports:
      - "9915:9915"
    volumes:
      - /var/xa-note/data:/app/data
    environment:
      NODE_ENV: production
      PORT: 9915
    restart: unless-stopped
```

#### **Nginx Reverse Proxy Example**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:9915;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

Thanks to all contributors of the open-source ecosystem. XA Note leverages the following excellent open-source projects:

- React – UI library  
- TypeScript – Typed JavaScript  
- Vite – Next-gen build tool  
- Hono – Lightweight web framework  
- Tailwind CSS – Utility-first CSS framework  
- SQLite – Embedded database  

---

**XA Note** – A lightweight, self-hosted note-taking system, your personal knowledge management companion 🚀