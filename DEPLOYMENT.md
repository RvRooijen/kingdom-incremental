# Deployment Guide - Kingdom Incremental

## 🚀 Vercel Deployment (Recommended - FREE)

### Prerequisites
- GitHub account
- Vercel account (gratis via GitHub login)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import `kingdom-incremental` repository
   - Keep all default settings
   - Click "Deploy"

3. **Environment Variables (if needed)**
   - None required for basic setup
   - Add `NODE_ENV=production` if needed

### Features on Vercel
- ✅ Automatic deploys on git push
- ✅ Free SSL certificate
- ✅ Custom domain support
- ✅ Serverless functions for API
- ✅ Global CDN for static files
- ✅ Zero configuration needed

### Live URL
After deployment, you'll get:
- `https://kingdom-incremental.vercel.app`
- Or connect your own domain

## 🎮 Alternative: GitHub Pages (Frontend Only)

If you want just the frontend:

1. **Build static version**
   ```bash
   # Create gh-pages branch
   git checkout -b gh-pages
   
   # Copy public files to root
   cp -r public/* .
   
   # Update API URL in game.js
   # Change: const API_BASE = '/api';
   # To: const API_BASE = 'https://your-api.vercel.app/api';
   
   # Commit and push
   git add .
   git commit -m "GitHub Pages deployment"
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages
   - Save

## 🔧 Local Testing Before Deploy

```bash
# Test production build
npm run build
npm start

# Test with Vercel CLI
npm i -g vercel
vercel dev
```

## 📊 Free Tier Limits

### Vercel Free Tier
- 100GB bandwidth/month
- Unlimited deployments
- Serverless function execution: 100GB-hours/month
- Perfect for this game!

### GitHub Pages
- 100GB bandwidth/month
- 1GB storage
- Static files only

## 🐛 Troubleshooting

### "Module not found" errors
- Check `tsconfig.json` paths
- Ensure all imports use correct case

### API not working
- Check Vercel function logs
- Verify routes in `vercel.json`

### Build fails
- Run `npm run build` locally first
- Check Node version (18+ required)

## 🎯 Next Steps After Deployment

1. **Add Analytics**
   ```html
   <!-- In index.html -->
   <script async src="https://analytics.umami.is/script.js" data-website-id="YOUR-ID"></script>
   ```

2. **Add Error Tracking**
   - Sentry.io free tier
   - LogRocket free tier

3. **Database (when needed)**
   - Supabase (PostgreSQL) - Free tier
   - PlanetScale (MySQL) - Free tier
   - MongoDB Atlas - Free tier

4. **Custom Domain**
   - Add in Vercel dashboard
   - Point DNS to Vercel

## 🎉 Congratulations!

Your Kingdom Incremental game is now live and free to play!