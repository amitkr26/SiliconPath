# 14-DEPLOYMENT-INFRASTRUCTURE — CI/CD & Deployments

1. **Frontend Deployment**:
   - Platform: **Vercel**
   - Branch: `main` (Automatic Continuous Deployment)
   - Build Command: `npm run build`
2. **Backend Deployment**:
   - Platform: **Render**
   - Service: `berojgardegreewala-backend` (`https://berojgardegreewala-backend.onrender.com`)
   - Build Command: `cd backend/server && npm install && npm run build`
   - Start Command: `node dist/index.js`
