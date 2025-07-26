# Deployment Guide

## Backend Deployment (Render)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Render**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `classroom-poll-server`
     - Root Directory: `server`
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
   - Add Environment Variables:
     - `NODE_ENV`: `production`
     - `CLIENT_URL`: Your frontend URL (will update after Vercel deployment)
   - Click "Create Web Service"
   - Note your backend URL (e.g., `https://classroom-poll-server.onrender.com`)

## Frontend Deployment (Vercel)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   
   Option A - Using CLI:
   ```bash
   vercel
   ```
   
   Option B - Using GitHub:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Create React App
     - Root Directory: `./` (leave as is)
   - Add Environment Variables:
     - `REACT_APP_SERVER_URL`: Your Render backend URL
   - Click "Deploy"

3. **Update Backend CORS**:
   - Go back to Render dashboard
   - Update the `CLIENT_URL` environment variable to your Vercel URL
   - The service will automatically redeploy

## Post-Deployment

1. Test the live app at your Vercel URL
2. Create a poll as teacher
3. Scan QR code on another device to test voting
4. Monitor logs in both Render and Vercel dashboards

## Free Tier Limits

- **Render**: Spins down after 15 minutes of inactivity (first request will be slow)
- **Vercel**: Generous free tier, no spin-down issues

## Custom Domain (Optional)

Both Render and Vercel support custom domains in their free tiers.