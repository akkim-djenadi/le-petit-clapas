# Le Petit Clapas

## Deploy Configuration (configured by /setup-deploy)
- Platform: Render
- Production URL (API): https://le-petit-clapas.onrender.com
- Production URL (Frontend): https://le-petit-clapas-web.onrender.com
- Deploy workflow: auto-deploy on push to main (Render picks up render.yaml)
- Merge method: squash
- Project type: web app (Node.js API + React/Vite static site)
- Post-deploy health check: https://le-petit-clapas.onrender.com/api/health

### Custom deploy hooks
- Pre-merge: none
- Deploy trigger: automatic on push to main
- Deploy status: poll https://le-petit-clapas.onrender.com/api/health
- Health check: https://le-petit-clapas.onrender.com/api/health

### Services
- `le-petit-clapas` — Web Service (Node.js API), Frankfurt region, free plan
- `le-petit-clapas-web` — Static Site (React/Vite), Frankfurt region, free plan

### Database
- Provider: TiDB Cloud Serverless (MySQL-compatible)
- Port: 4000 (TiDB default)
- SSL required in production (configured in server/config/database.js)
- Set env vars on Render dashboard: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
