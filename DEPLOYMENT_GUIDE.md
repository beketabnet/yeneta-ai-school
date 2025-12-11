# Production Deployment Guide

## Yeneta AI School Platform - Complete Deployment Instructions

**Date**: November 6, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

---

## 📋 Pre-Deployment Checklist

### **System Requirements**

#### **Server Specifications**
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD (for Ollama models + data)
- **OS**: Ubuntu 22.04 LTS or Windows Server 2022
- **Network**: Stable internet connection

#### **Software Requirements**
- Python 3.11+
- PostgreSQL 15+ (or MySQL 8+)
- Nginx 1.24+
- Redis 7+ (for caching)
- Ollama (latest version)
- Node.js 18+ (for frontend)

---

## 🚀 Deployment Steps

### **Phase 1: Server Setup**

#### 1. Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y python3.11 python3.11-venv python3-pip \
  postgresql postgresql-contrib nginx redis-server git curl
```

#### 2. Create Application User
```bash
# Create dedicated user
sudo useradd -m -s /bin/bash yeneta
sudo usermod -aG sudo yeneta

# Switch to yeneta user
sudo su - yeneta
```

#### 3. Install Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull llama3.2:1b
ollama pull gemma2:2b
ollama pull llava:7b
ollama pull mxbai-embed-large:latest

# Verify installation
ollama list
```

---

### **Phase 2: Database Setup**

#### 1. Create PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE yeneta_db;
CREATE USER yeneta_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
ALTER ROLE yeneta_user SET client_encoding TO 'utf8';
ALTER ROLE yeneta_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE yeneta_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE yeneta_db TO yeneta_user;

# Exit psql
\q
```

#### 2. Configure PostgreSQL
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Update settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

### **Phase 3: Application Deployment**

#### 1. Clone Repository
```bash
cd /home/yeneta
git clone https://github.com/your-org/yeneta-ai-school.git
cd yeneta-ai-school/yeneta_backend
```

#### 2. Create Virtual Environment
```bash
python3.11 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### 4. Configure Environment Variables
```bash
# Create production .env file
nano .env
```

**Production `.env` Configuration**:
```bash
# Django Settings
SECRET_KEY=GENERATE_NEW_SECRET_KEY_HERE
DEBUG=False
ALLOWED_HOSTS=yeneta-ai-school.com,www.yeneta-ai-school.com

# Database
DATABASE_URL=postgresql://yeneta_user:STRONG_PASSWORD@localhost:5432/yeneta_db

# LLM API Keys (ROTATE THESE!)
GEMINI_API_KEY=your_production_gemini_key
OPENAI_API_KEY=your_production_openai_key
SERP_API_KEY=your_production_serp_key

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_TEXT_SMALL=llama3.2:1b
OLLAMA_MODEL_TEXT_MEDIUM=gemma2:2b
OLLAMA_MODEL_MULTIMODAL=llava:7b
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large:latest

# RAG Configuration
ENABLE_RAG=True
RAG_TOP_K=5
RAG_MAX_CONTEXT_TOKENS=2000
RAG_RELEVANCE_THRESHOLD=0.5

# Cost Management
MONTHLY_BUDGET_USD=500.00
STUDENT_DAILY_LIMIT=0.10
TEACHER_DAILY_LIMIT=1.00
ENABLE_COST_OPTIMIZATION=True

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000

# CORS
CORS_ALLOWED_ORIGINS=https://yeneta-ai-school.com,https://www.yeneta-ai-school.com
```

#### 5. Generate New SECRET_KEY
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### 6. Run Migrations
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

#### 7. Create Superuser
```bash
python manage.py createsuperuser
```

#### 8. Index Curriculum Documents
```bash
python manage.py index_curriculum media/curriculum_docs --clear
```

---

### **Phase 4: Gunicorn Setup**

#### 1. Create Gunicorn Configuration
```bash
nano /home/yeneta/yeneta-ai-school/gunicorn_config.py
```

```python
# gunicorn_config.py
bind = "127.0.0.1:8000"
workers = 4  # (2 x CPU cores) + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "/home/yeneta/logs/gunicorn-access.log"
errorlog = "/home/yeneta/logs/gunicorn-error.log"
loglevel = "info"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
```

#### 2. Create Systemd Service
```bash
sudo nano /etc/systemd/system/yeneta.service
```

```ini
[Unit]
Description=Yeneta AI School Gunicorn Service
After=network.target postgresql.service

[Service]
Type=notify
User=yeneta
Group=yeneta
WorkingDirectory=/home/yeneta/yeneta-ai-school/yeneta_backend
Environment="PATH=/home/yeneta/yeneta-ai-school/yeneta_backend/venv/bin"
ExecStart=/home/yeneta/yeneta-ai-school/yeneta_backend/venv/bin/gunicorn \
    --config /home/yeneta/yeneta-ai-school/gunicorn_config.py \
    yeneta_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 3. Start Gunicorn Service
```bash
# Create log directory
mkdir -p /home/yeneta/logs

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable yeneta
sudo systemctl start yeneta
sudo systemctl status yeneta
```

---

### **Phase 5: Nginx Configuration**

#### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/yeneta
```

```nginx
upstream yeneta_backend {
    server 127.0.0.1:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yeneta-ai-school.com www.yeneta-ai-school.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yeneta-ai-school.com www.yeneta-ai-school.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yeneta-ai-school.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yeneta-ai-school.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/yeneta-access.log;
    error_log /var/log/nginx/yeneta-error.log;

    # Max upload size
    client_max_body_size 50M;

    # Static files
    location /static/ {
        alias /home/yeneta/yeneta-ai-school/yeneta_backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/yeneta/yeneta-ai-school/yeneta_backend/media/;
        expires 7d;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://yeneta_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts for LLM requests
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Admin panel
    location /admin/ {
        proxy_pass http://yeneta_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (if serving from same domain)
    location / {
        root /home/yeneta/yeneta-ai-school/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 2. Enable Site and Restart Nginx
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/yeneta /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### **Phase 6: SSL Certificate (Let's Encrypt)**

#### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d yeneta-ai-school.com -d www.yeneta-ai-school.com
```

#### 3. Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

---

### **Phase 7: Monitoring & Logging**

#### 1. Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/yeneta
```

```
/home/yeneta/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 yeneta yeneta
    sharedscripts
    postrotate
        systemctl reload yeneta
    endscript
}
```

#### 2. Install Monitoring Tools
```bash
# Install htop for resource monitoring
sudo apt install -y htop

# Install fail2ban for security
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

### **Phase 8: Backup Strategy**

#### 1. Database Backup Script
```bash
nano /home/yeneta/scripts/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/yeneta/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="yeneta_db_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U yeneta_user yeneta_db | gzip > $BACKUP_DIR/$FILENAME

# Keep only last 30 days
find $BACKUP_DIR -name "yeneta_db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

```bash
chmod +x /home/yeneta/scripts/backup_db.sh
```

#### 2. Schedule Backups
```bash
crontab -e
```

```cron
# Daily database backup at 2 AM
0 2 * * * /home/yeneta/scripts/backup_db.sh

# Weekly vector store backup
0 3 * * 0 tar -czf /home/yeneta/backups/vector_store_$(date +\%Y\%m\%d).tar.gz /home/yeneta/yeneta-ai-school/yeneta_backend/data/vector_store
```

---

## 🧪 Post-Deployment Testing

### **1. Health Checks**

```bash
# Test Django
curl https://yeneta-ai-school.com/admin/

# Test API
curl https://yeneta-ai-school.com/api/ai-tools/system-status/

# Test Ollama
curl http://localhost:11434/api/tags
```

### **2. Run System Tests**

```bash
cd /home/yeneta/yeneta-ai-school/yeneta_backend
source venv/bin/activate
python test_system.py
```

### **3. Performance Benchmarks**

```bash
python benchmark_performance.py
```

### **4. Security Scan**

```bash
# Django security check
python manage.py check --deploy

# Run Bandit
bandit -r yeneta_backend/
```

---

## 📊 Monitoring Dashboard

### **Key Metrics to Monitor**

1. **System Resources**
   - CPU usage
   - Memory usage
   - Disk space
   - Network bandwidth

2. **Application Metrics**
   - Request rate
   - Response times
   - Error rates
   - Active users

3. **LLM Metrics**
   - API calls per hour
   - Cost per day
   - Token usage
   - Model distribution

4. **Database Metrics**
   - Query performance
   - Connection pool
   - Database size

---

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Gunicorn Won't Start**
```bash
# Check logs
sudo journalctl -u yeneta -n 50

# Check permissions
ls -la /home/yeneta/yeneta-ai-school/

# Test manually
cd /home/yeneta/yeneta-ai-school/yeneta_backend
source venv/bin/activate
gunicorn yeneta_backend.wsgi:application
```

#### **2. Nginx 502 Bad Gateway**
```bash
# Check if Gunicorn is running
sudo systemctl status yeneta

# Check Nginx error log
sudo tail -f /var/log/nginx/yeneta-error.log

# Test upstream
curl http://127.0.0.1:8000/admin/
```

#### **3. Database Connection Issues**
```bash
# Test database connection
psql -U yeneta_user -d yeneta_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### **4. Ollama Not Responding**
```bash
# Check Ollama status
systemctl status ollama

# Restart Ollama
sudo systemctl restart ollama

# Test Ollama
ollama list
```

---

## 🔄 Update Procedure

### **Deploying Updates**

```bash
# 1. Backup database
/home/yeneta/scripts/backup_db.sh

# 2. Pull latest code
cd /home/yeneta/yeneta-ai-school
git pull origin main

# 3. Activate virtual environment
cd yeneta_backend
source venv/bin/activate

# 4. Install new dependencies
pip install -r requirements.txt

# 5. Run migrations
python manage.py migrate

# 6. Collect static files
python manage.py collectstatic --noinput

# 7. Restart services
sudo systemctl restart yeneta
sudo systemctl reload nginx

# 8. Verify deployment
python test_system.py
```

---

## 📞 Support & Maintenance

### **Regular Maintenance Tasks**

**Daily**:
- Monitor system resources
- Check error logs
- Review LLM costs

**Weekly**:
- Review backup logs
- Check security alerts
- Update dependencies

**Monthly**:
- Security audit
- Performance review
- Cost optimization review
- Update SSL certificates (auto)

### **Emergency Contacts**

- **System Admin**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: security@yeneta-ai-school.com
- **Support**: support@yeneta-ai-school.com

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] Server provisioned and configured
- [ ] Database created and configured
- [ ] All API keys rotated
- [ ] SSL certificate obtained
- [ ] Backup strategy implemented
- [ ] Monitoring set up

### **Deployment**
- [ ] Code deployed
- [ ] Dependencies installed
- [ ] Migrations run
- [ ] Static files collected
- [ ] Curriculum documents indexed
- [ ] Services started

### **Post-Deployment**
- [ ] Health checks passed
- [ ] System tests passed
- [ ] Performance benchmarks acceptable
- [ ] Security scan passed
- [ ] Monitoring active
- [ ] Backups verified

### **Go-Live**
- [ ] DNS updated
- [ ] SSL working
- [ ] All endpoints tested
- [ ] User acceptance testing complete
- [ ] Documentation updated
- [ ] Team trained

---

**Deployment Date**: [To be filled]  
**Deployed By**: [To be filled]  
**Version**: 1.0.0  
**Status**: ✅ Ready for Production
